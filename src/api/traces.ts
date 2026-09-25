// 트레이스 (api-spec 5번 GET /traces/scatter, VIEWER+). 트랜잭션 화면 · 서버맵 미니 스캐터가 쓴다
import { api } from './client'

export type ScatterPoint = {
  trace_id: string
  start_time: string
  duration_ms: number
  is_error: boolean
  http_status: number | null
  span_name: string
  agent_key: string
}

/** raw = 점 하나가 요청 하나. bucketed = 점이 limit 을 넘어 서버가 격자로 접은 결과 (서버가 정한다) */
export type Scatter = { mode: 'raw' | 'bucketed'; total_count: number; points: ScatterPoint[] }

export type ScatterQuery = { serviceName: string; from: string; to: string; agentKey?: string; limit?: number }

export function getScatter({ serviceName, from, to, agentKey, limit }: ScatterQuery, signal?: AbortSignal): Promise<Scatter> {
  return api.get<Scatter>('/traces/scatter', { query: { service_name: serviceName, from, to, agent_key: agentKey, limit }, signal })
}
