// 플랫폼 상태 가짜 응답 — ⚠️ 제안 문 #51~#53 (명세 미확정, src/api/platform.ts 머리 주석 참고).
// 파수꾼이 30초마다 카나리를 쏘고 약 12초 뒤 조회 가능해진다고 보고, 지금 시각으로 신선도를 계산한다.
// 매시 54분대 1분은 파이프라인이 밀린 것처럼 STALE(74초), 53분에는 Dead Man's Switch 핑이 한 번 빠진다.
// 콘솔에서 __monimoMock.canaryStale(true) 로 언제든 STALE 로 바꿀 수 있다
import { http } from 'msw'
import { API_BASE } from '../client'
import type { CanaryEvent, CanaryFreshness, PlatformService } from '../platform'
import { ok, okPage, timeRange, unauthenticated } from './common'

const SEC = 1000
const MIN = 60 * SEC
const THRESHOLD = 60
const PERIOD = 30 * SEC

let forcedStale = false
export const setCanaryStale = (on: boolean) => {
  forcedStale = on
}

const staleWindow = (t: number) => new Date(t).getUTCMinutes() === 54

/** 시각 t 에 본 카나리 나이(초) */
function ageAt(t: number): number {
  if (staleWindow(t)) return 74
  return 9 + Math.floor((t % PERIOD) / SEC) % 6
}

function freshness(now: number): CanaryFreshness {
  const age = forcedStale ? 95 : ageAt(now)
  return {
    service_name: 'shop-order',
    last_signal_at: new Date(now - age * SEC).toISOString(),
    age_sec: age,
    threshold_sec: THRESHOLD,
    fresh: age <= THRESHOLD,
    // DMS 핑은 매분 0초. 53분대에는 한 번 빠져 그 전 핑이 마지막
    dms_last_ping_at: new Date(Math.floor(now / MIN) * MIN - (new Date(now).getUTCMinutes() === 53 ? MIN : 0)).toISOString(),
  }
}

function services(now: number): PlatformService[] {
  const rows: [string, boolean, string[], number, number, string?][] = [
    ['monimo-api', true, ['PostgreSQL', 'ClickHouse'], 3, 2],
    ['monimo-collector', true, ['Kafka', 'PG 설정 캐시 v7'], 4, 2],
    ['monimo-ingest', true, ['Kafka', 'ClickHouse'], 2, 3],
    ['monimo-detector', true, ['PostgreSQL'], 2, 2],
    ['monimo-notifier', false, ['PostgreSQL'], 2, 4, '알림 실패 2건'],
    ['monimo-watchdog', true, ['외부 웹훅 도달'], 1, 0],
  ]
  return rows.map(([service_name, ready, deps, pod_count, agoSec, note]) => ({
    service_name,
    // 강제 STALE 이면 적재 처리기가 멈춘 것처럼 보여 준다
    ready: forcedStale && service_name === 'monimo-ingest' ? false : ready,
    deps,
    pod_count,
    checked_at: new Date(now - agoSec * SEC).toISOString(),
    note: forcedStale && service_name === 'monimo-ingest' ? 'ClickHouse 쓰기 지연' : (note ?? null),
  }))
}

/** 90초마다 판정 한 줄. STALE 이면 Slack 직접 발송, 매시 53분에는 DMS_MISSED 한 줄 */
function events(from: number, to: number): CanaryEvent[] {
  const step = 90 * SEC
  const out: CanaryEvent[] = []
  for (let t = Math.floor(to / step) * step; t >= from && out.length < 2000; t -= step) {
    const age = ageAt(t)
    const stale = age > THRESHOLD
    out.push({ ts: new Date(t).toISOString(), kind: stale ? 'STALE' : 'FRESH', age_sec: age, threshold_sec: THRESHOLD, action: stale ? `Slack 직접 발송 · 탐지 후 17초` : null })
    const dms = Math.floor(t / (60 * MIN)) * 60 * MIN + 53 * MIN
    if (dms < t && dms >= t - step && dms >= from) out.push({ ts: new Date(dms).toISOString(), kind: 'DMS_MISSED', age_sec: null, threshold_sec: THRESHOLD, action: 'Healthchecks.io 핑 미수신 1회' })
  }
  return out
}

export const platformHandlers = [
  http.get(`${API_BASE}/platform/canary`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    return ok(freshness(Date.now()))
  }),

  http.get(`${API_BASE}/platform/services`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    return ok(services(Date.now()))
  }),

  http.get(`${API_BASE}/platform/canary/events`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    // 다른 시간 범위 문과 같은 규칙 — from · to 가 없거나 from ≥ to 면 422
    const url = new URL(request.url)
    const range = timeRange(url)
    if (range instanceof Response) return range
    const q = url.searchParams
    const rows = events(range.from, Math.min(range.to, Date.now()))
    const limit = Math.min(Number(q.get('limit')) || 50, 500)
    const offset = Number(q.get('cursor')) || 0
    return okPage(rows.slice(offset, offset + limit), limit, offset + limit < rows.length ? String(offset + limit) : null)
  }),
]
