// 파드 (api-spec 47번 GET /agents, VIEWER+). 트랜잭션 파드 필터 · 인스펙터 파드 목록이 쓴다
import { api, type Page } from './client'

export type AgentStatus = 'UP' | 'DOWN' | 'UNKNOWN'

export type Agent = {
  agent_uuid: string
  service_name: string
  /** 파드 이름. 신호 조회의 agent_key 와 같은 글자 */
  agent_key: string
  hostname: string
  ip: string
  jvm_version: string
  agent_version: string
  status: AgentStatus
}

export type AgentsQuery = { serviceName?: string | null; status?: AgentStatus; cursor?: string | null; limit?: number }

export function listAgents({ serviceName, status, cursor, limit }: AgentsQuery = {}, signal?: AbortSignal): Promise<Page<Agent>> {
  return api.getPage<Agent>('/agents', { query: { service_name: serviceName, status, cursor, limit }, signal })
}
