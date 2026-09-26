// 파드 가짜 응답 (GET /agents · /agents/:uuid · /agents/:uuid/active-threads). 서비스마다 2개,
// shop-order 는 시안(Inspector.dc.html)처럼 6개 — UP 4 · DOWN 1(25분 전부터 신호 없음) · UNKNOWN 1(최근 신호 없음)
import { http } from 'msw'
import { API_BASE } from '../client'
import type { ActiveThreads, AgentDetail, AgentStatus } from '../agents'
import { APPLICATIONS, fail, ok, okPage, unauthenticated } from './common'
import { lastPoint } from './metrics'
import { HOUR } from './serverMap'

const SUFFIX: Record<string, [string, AgentStatus][]> = {
  'shop-order': [
    ['7d9f4-x2k8q', 'UP'],
    ['7d9f4-m6p1v', 'UP'],
    ['7d9f4-q4t0b', 'UP'],
    ['6c81b-h5r3n', 'DOWN'],
    ['7d9f4-z9k1w', 'UP'],
    ['6c81b-t3y6d', 'UNKNOWN'],
  ],
}

export const AGENTS: AgentDetail[] = HOUR.nodes.flatMap(({ service_name }, i) =>
  (
    SUFFIX[service_name] ?? [
      ['7d9f4-x2k8q', 'UP'],
      ['7d9f4-m4p1z', 'UP'],
    ]
  ).map(([suffix, status], j) => ({
    agent_uuid: `3a9c0d10-0000-4b00-8000-0000000${i}${j}0${j}`,
    application_uuid: APPLICATIONS.find((a) => a.name === service_name)?.application_uuid ?? '',
    service_name,
    agent_key: `${service_name}-${suffix}`,
    hostname: `ip-10-42-${17 + (j % 3)}-${String(64 + j * 7).padStart(2, '0')}`,
    ip: `10.42.${17 + (j % 3)}.${64 + j * 7}`,
    jvm_version: suffix.startsWith('6c81b') ? '17.0.9' : '21.0.4',
    agent_version: 'otel 2.8.0 / ext 0.1.0',
    status,
    first_seen_at: `2026-09-${String(10 + j).padStart(2, '0')}T08:12:44Z`,
    updated_at: '2026-09-21T06:00:12Z',
  })),
)

/** DOWN 파드의 마지막 신호 (지금 기준 몇 분 전) */
export const DOWN_SINCE_MIN = 25

/** 트래픽 · 로그를 만드는 파드 — 살아 있는(UP) 것만 */
export const agentKeysOf = (service: string) => AGENTS.filter((a) => a.service_name === service && a.status === 'UP').map((a) => a.agent_key)

/** 목록 응답에는 상세 필드가 없다 (명세 47번) */
const toListItem = ({ application_uuid: _a, first_seen_at: _f, updated_at: _u, ...rest }: AgentDetail) => rest

export const agentsHandlers = [
  http.get(`${API_BASE}/agents`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const q = new URL(request.url).searchParams
    const limit = Math.min(Number(q.get('limit')) || 50, 500)
    const rows = AGENTS.filter((a) => (!q.get('service_name') || a.service_name === q.get('service_name')) && (!q.get('status') || a.status === q.get('status')))
    return okPage(rows.slice(0, limit).map(toListItem), limit, rows.length > limit ? 'mock-next' : null)
  }),

  http.get(`${API_BASE}/agents/:uuid`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const a = AGENTS.find((x) => x.agent_uuid === params.uuid)
    return a ? ok(a) : fail(404, 'NOT_FOUND', '파드를 찾을 수 없습니다.')
  }),

  // 지금 스레드 수: jvm.thread.count 의 마지막 1분 값. 신호가 없는 파드(UNKNOWN)는 404
  http.get(`${API_BASE}/agents/:uuid/active-threads`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const a = AGENTS.find((x) => x.agent_uuid === params.uuid)
    if (!a) return fail(404, 'NOT_FOUND', '파드를 찾을 수 없습니다.')
    const p = lastPoint(a, 'jvm.thread.count')
    if (!p) return fail(404, 'NOT_FOUND', '이 파드의 스레드 수 신호가 없습니다.')
    const body: ActiveThreads = { agent_uuid: a.agent_uuid, agent_key: a.agent_key, service_name: a.service_name, metric_name: 'jvm.thread.count', ts_min: p.ts_min, last_v: p.last_v }
    return ok(body)
  }),
]
