// 에러 분석 (api-spec 3번 GET /errors · 36번 GET /errors/timeline, VIEWER+)
import { api, type Page } from './client'
import type { SpanKind, SpanStatus } from './traces'

/** 실패한 스팬 한 줄 */
export type ErrorSpan = {
  trace_id: string
  span_id: string
  start_time: string
  duration_ns: number
  service_name: string
  agent_key: string
  span_name: string
  span_kind: SpanKind
  status_code: SpanStatus
  http_status: number | null
  exception_type: string | null
  exception_message: string | null
}

export type ErrorsQuery = {
  serviceName: string
  from: string
  to: string
  agentKey?: string
  httpStatus?: number
  exceptionType?: string
  cursor?: string | null
  limit?: number
}

/** 실패한 스팬 목록 (시간 역순, 커서 페이징) */
export function listErrors(q: ErrorsQuery, signal?: AbortSignal): Promise<Page<ErrorSpan>> {
  return api.getPage<ErrorSpan>('/errors', {
    query: {
      service_name: q.serviceName,
      from: q.from,
      to: q.to,
      agent_key: q.agentKey,
      http_status: q.httpStatus,
      exception_type: q.exceptionType,
      cursor: q.cursor,
      limit: q.limit,
    },
    signal,
  })
}

/** 상태코드 대역. 상태코드가 없는 실패(예외만 있는 내부 스팬)는 'other' */
export type HttpStatusClass = '4xx' | '5xx' | 'other'

export type ErrorTimelinePoint = { ts_min: string; http_status_class: HttpStatusClass; exception_type: string | null; cnt: number }

export type ErrorTimeline = { step: number; series: ErrorTimelinePoint[] }

export type ErrorTimelineQuery = { serviceName: string; from: string; to: string; step?: number }

/** 시간대별 에러 건수 (step 초 칸 × 상태코드 대역 × 예외 타입) */
export function getErrorTimeline({ serviceName, from, to, step }: ErrorTimelineQuery, signal?: AbortSignal): Promise<ErrorTimeline> {
  return api.get<ErrorTimeline>('/errors/timeline', { query: { service_name: serviceName, from, to, step }, signal })
}
