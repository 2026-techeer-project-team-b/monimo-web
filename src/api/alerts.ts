// 경보 이벤트 (api-spec 16번 GET /alert-events · 45번 상세 · 24번 알림 발송 이력, VIEWER+). 경보 화면 · 서버맵 발화 중 띠가 쓴다
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

/** 경보 규칙이 재는 값 7종 */
export type MetricKind = '5XX_RATE' | '4XX_RATE' | 'P95_LATENCY' | 'CPU' | 'HEAP' | 'GC_TIME' | 'AGENT_DOWN'
/** 비교 방법: 크다 · 크거나 같다 · 작다 · 작거나 같다 */
export type Operator = 'GT' | 'GTE' | 'LT' | 'LTE'

/** 경보 하나의 상세 — 목록 필드 + 규칙 조건 */
export type AlertEventDetail = AlertEvent & {
  metric_kind: MetricKind
  operator: Operator
  threshold: number
  window_sec: number
}

export function getAlertEvent(uuid: string, signal?: AbortSignal): Promise<AlertEventDetail> {
  return api.get<AlertEventDetail>(`/alert-events/${encodeURIComponent(uuid)}`, { signal })
}

export type ChannelType = 'SLACK' | 'EMAIL' | 'WEBHOOK' | 'PAGERDUTY'
export type NotifyResult = 'SUCCESS' | 'FAIL'

/** 이 경보를 채널 하나로 보낸 기록 */
export type AlertNotification = {
  notification_uuid: string
  alert_channel_uuid: string
  channel_name: string
  type: ChannelType
  result: NotifyResult
  /** 실패 뒤 다시 보낸 횟수 */
  retry_count: number
  /** 채널이 돌려준 응답 (예: 200 ok · 429 rate_limited) */
  response: string
  sent_at: string
}

export function listAlertNotifications(uuid: string, { cursor, limit }: { cursor?: string | null; limit?: number } = {}, signal?: AbortSignal): Promise<Page<AlertNotification>> {
  return api.getPage<AlertNotification>(`/alert-events/${encodeURIComponent(uuid)}/notifications`, { query: { cursor, limit }, signal })
}
