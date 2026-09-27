// 지표 가짜 응답 (GET /metrics/series · /metrics/names). 값은 파드 · 지표 · 분마다 정해지는 난수로 만들어
// 새로고침해도 같은 분이면 같은 값이 나온다. 단위는 OTel 원래 단위(비율 0~1 · 바이트 · ms)로 보내고 화면이 바꿔 보여 준다
import { http } from 'msw'
import { API_BASE } from '../client'
import type { AgentDetail } from '../agents'
import type { MetricName, MetricPoint, MetricSeries, MetricSeriesLine, MetricSource } from '../metrics'
import { AGENTS, DOWN_SINCE_MIN } from './agents'
import { fail, ok, seeded, timeRange, unauthenticated } from './common'

const MIN = 60_000
const MB = 1024 * 1024

type Def = {
  /** 속성 조합마다 한 줄 */
  lines: Record<string, string>[]
  /** 버킷 시각 t(ms) 의 대표값. r 은 0~1 난수, w 는 -1~1 의 느린 물결, spike 는 가끔 1 */
  value: (r: number, w: number, spike: boolean, line: number) => number
  /** 한 버킷 안 흔들림(min · max 폭, 대표값 대비 비율) */
  spread: number
}

const DEFS: Record<string, Def> = {
  'jvm.cpu.recent_utilization': { lines: [{}], value: (r, w, s) => Math.min(0.98, 0.3 + w * 0.08 + r * 0.06 + (s ? 0.2 : 0)), spread: 0.25 },
  'jvm.memory.used{heap}': { lines: [{ 'jvm.memory.type': 'heap' }], value: (r, w, s) => (1150 + w * 180 + r * 90 + (s ? 250 : 0)) * MB, spread: 0.12 },
  'jvm.gc.duration': { lines: [{}], value: (r, _w, s) => (s ? 88 + r * 20 : 22 + r * 28), spread: 0.3 },
  'jvm.thread.count': { lines: [{}], value: (r, w) => Math.round(128 + w * 14 + r * 6), spread: 0.05 },
  'process.cpu.utilization': { lines: [{}], value: (r, w) => 0.34 + w * 0.08 + r * 0.05, spread: 0.2 },
  'jvm.memory.used{non_heap}': { lines: [{ 'jvm.memory.type': 'non_heap' }], value: (r, w) => (182 + w * 6 + r * 3) * MB, spread: 0.02 },
  'jvm.class.count': { lines: [{}], value: (r) => Math.round(15480 + r * 12), spread: 0 },
  'db.client.connections.usage': {
    lines: [
      { 'pool.name': 'HikariPool-1', state: 'used' },
      { 'pool.name': 'HikariPool-1', state: 'idle' },
    ],
    value: (r, w, _s, line) => Math.round(line === 0 ? 6 + w * 3 + r * 3 : 10 - w * 3 - r * 2),
    spread: 0.3,
  },
  'http.server.request.duration': { lines: [{ 'http.route': '/api/*' }], value: (r, w, s) => 95 + w * 25 + r * 30 + (s ? 400 : 0), spread: 0.6 },
  'jvm.buffer.memory.usage': { lines: [{ 'jvm.buffer.pool.name': 'direct' }], value: (r, w) => (18 + w * 2 + r) * MB, spread: 0.05 },
}

const ATTRIBUTE_KEYS = (name: string) => [...new Set(DEFS[name].lines.flatMap((l) => Object.keys(l)))]

/** 시간 범위로 step · 원본 표 고르기 (명세 15번 "원본/1분/1시간 자동 선택") — 점이 대략 360개를 넘지 않게 */
function pickStep(hours: number, asked: number | null): { step: number; source: MetricSource } {
  const auto = hours <= 6 ? 60 : hours <= 24 ? 300 : hours <= 24 * 7 ? 1800 : 3600
  const step = asked && asked >= 60 ? Math.max(asked - (asked % 60), auto) : auto
  return { step, source: step >= 3600 ? 'metrics_1h' : 'metrics_1m' }
}

/** 한 파드 한 지표의 점. UNKNOWN 은 신호 없음, DOWN 은 DOWN_SINCE_MIN 분 전까지만 */
function points(a: AgentDetail, name: string, line: number, from: number, to: number, stepSec: number): MetricPoint[] {
  const def = DEFS[name]
  if (!def || a.status === 'UNKNOWN') return []
  const end = a.status === 'DOWN' ? Math.min(to, Date.now() - DOWN_SINCE_MIN * MIN) : to
  const stepMs = stepSec * 1000
  const phase = seeded(a.agent_key)() * 100
  const out: MetricPoint[] = []
  for (let t = Math.ceil(from / stepMs) * stepMs; t < end; t += stepMs) {
    const r = seeded(`${a.agent_key}|${name}|${line}|${t}`)
    const w = Math.sin(t / (37 * MIN) + phase)
    const spike = r() > 0.93
    const v = def.value(r(), w, spike, line)
    const lo = v * (1 - def.spread * r())
    const hi = v * (1 + def.spread * r())
    const round = (x: number) => (Number.isInteger(v) ? Math.round(x) : Math.round(x * 1000) / 1000)
    out.push({ ts_min: new Date(t).toISOString(), avg_v: round(v), min_v: round(lo), max_v: round(hi), last_v: round(v + (hi - lo) * (r() - 0.5) * 0.5) })
  }
  return out
}

/** 파드의 지표 마지막 1분 값 (active-threads 가 쓴다). 끊긴 파드(DOWN)면 끊기기 전 마지막 값 — 최근 1시간 안에서 찾는다 */
export function lastPoint(a: AgentDetail, name: string): MetricPoint | null {
  const now = Date.now()
  const pts = points(a, name, 0, now - 60 * MIN, now, 60)
  return pts.at(-1) ?? null
}

export const metricsHandlers = [
  http.get(`${API_BASE}/metrics/series`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const url = new URL(request.url)
    const range = timeRange(url)
    if (range instanceof Response) return range
    const q = url.searchParams
    const service = q.get('service_name')
    const name = q.get('metric_name') ?? ''
    if (!service || !name) return fail(400, 'INVALID_REQUEST', 'service_name · metric_name 이 필요합니다.')
    const def = DEFS[name]
    const { step, source } = pickStep(range.hours, Number(q.get('step')) || null)
    const agents = AGENTS.filter((a) => a.service_name === service && (!q.get('agent_key') || a.agent_key === q.get('agent_key')))
    const series: MetricSeriesLine[] = def
      ? agents.flatMap((a) => def.lines.map((attributes, i) => ({ agent_key: a.agent_key, attributes, points: points(a, name, i, range.from, range.to, step) })))
      : []
    const body: MetricSeries = { metric_name: name, source_table: source, step, series: series.filter((s) => s.points.length) }
    return ok(body)
  }),

  // 최근에 들어온 지표 이름. 서비스마다 같다
  http.get(`${API_BASE}/metrics/names`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    if (!new URL(request.url).searchParams.get('service_name')) return fail(400, 'INVALID_REQUEST', 'service_name 이 필요합니다.')
    const body: MetricName[] = Object.keys(DEFS).map((metric_name) => ({ metric_name, attribute_keys: ATTRIBUTE_KEYS(metric_name) }))
    return ok(body)
  }),
]
