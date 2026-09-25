// 트레이스 (api-spec 5번 GET /traces/scatter · 26번 GET /traces/transactions, VIEWER+). 트랜잭션 화면 · 서버맵 미니 스캐터가 쓴다
import { api, type Page } from './client'

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

/** 드래그한 사각형(시각 × 응답시간) 안의 요청 한 건 */
export type Transaction = {
  trace_id: string
  start_time: string
  duration_ms: number
  service_name: string
  agent_key: string
  span_name: string
  is_error: boolean
  http_status: number | null
}

export type TransactionsQuery = {
  serviceName: string
  from: string
  to: string
  agentKey?: string
  minDurationMs?: number
  maxDurationMs?: number
  isError?: boolean
  cursor?: string | null
  limit?: number
}

export function listTransactions(q: TransactionsQuery, signal?: AbortSignal): Promise<Page<Transaction>> {
  return api.getPage<Transaction>('/traces/transactions', {
    query: {
      service_name: q.serviceName,
      from: q.from,
      to: q.to,
      agent_key: q.agentKey,
      min_duration_ms: q.minDurationMs,
      max_duration_ms: q.maxDurationMs,
      is_error: q.isError,
      cursor: q.cursor,
      limit: q.limit,
    },
    signal,
  })
}
