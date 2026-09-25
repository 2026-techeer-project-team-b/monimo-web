// 경보 이벤트 (api-spec 16번 GET /alert-events, VIEWER+, 기본 FIRING). 경보 화면 · 서버맵 발화 중 띠가 쓴다
import { api, type Page } from './client'

export type AlertState = 'FIRING' | 'RESOLVED'
export type Severity = 'CRITICAL' | 'WARNING' | 'INFO'

export type AlertEvent = {
  alert_event_uuid: string
  alert_rule_uuid: string
  rule_name: string
  service_name: string
  agent_key: string | null
  fingerprint: string
  state: AlertState
  severity: Severity
  /** 경보가 울릴 때 잰 값. 단위는 규칙의 metric_kind 에 따른다 (이 응답에는 없다) */
  observed_value: number
  fired_at: string
  resolved_at: string | null
}

export type AlertEventsQuery = {
  serviceName?: string | null
  state?: AlertState
  severity?: Severity
  from?: string
  to?: string
  cursor?: string | null
  limit?: number
}

export function listAlertEvents(q: AlertEventsQuery = {}, signal?: AbortSignal): Promise<Page<AlertEvent>> {
  const { serviceName, state, severity, from, to, cursor, limit } = q
  return api.getPage<AlertEvent>('/alert-events', { query: { service_name: serviceName, state, severity, from, to, cursor, limit }, signal })
}
