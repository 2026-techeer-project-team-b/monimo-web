// 파드 가짜 응답 (GET /agents). 서비스마다 2개(shop-order 는 시안처럼 3개)
import { http } from 'msw'
import { API_BASE } from '../client'
import type { Agent } from '../agents'
import { okPage, unauthenticated } from './common'
import { HOUR } from './serverMap'

const SUFFIX: Record<string, string[]> = { 'shop-order': ['x2k8q', 'm6p1v', 'q4t0b'] }

export const AGENTS: Agent[] = HOUR.nodes.flatMap(({ service_name }, i) =>
  (SUFFIX[service_name] ?? ['x2k8q', 'm4p1z']).map((suffix, j) => ({
    agent_uuid: `3a9c0d10-0000-4b00-8000-0000000${i}${j}0${j}`,
    service_name,
    agent_key: `${service_name}-7d9f4-${suffix}`,
    hostname: `${service_name}-7d9f4-${suffix}`,
    ip: `10.42.${i + 1}.${j + 11}`,
    jvm_version: '21.0.4',
    agent_version: '2.8.0',
    status: 'UP' as const,
  })),
)

export const agentKeysOf = (service: string) => AGENTS.filter((a) => a.service_name === service).map((a) => a.agent_key)

export const agentsHandlers = [
  http.get(`${API_BASE}/agents`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const q = new URL(request.url).searchParams
    const limit = Math.min(Number(q.get('limit')) || 50, 500)
    const rows = AGENTS.filter((a) => (!q.get('service_name') || a.service_name === q.get('service_name')) && (!q.get('status') || a.status === q.get('status')))
    return okPage(rows.slice(0, limit), limit, rows.length > limit ? 'mock-next' : null)
  }),
]
