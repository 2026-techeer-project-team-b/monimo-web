// 경보 가짜 응답 (GET /alert-events · /alert-events/:uuid · /alert-events/:uuid/notifications).
// 시안(Alerts.dc.html)의 이벤트 8건 — 발화 중 3 · 해소 5. 시각은 지금 기준(몇 분 전)으로 만든다.
// 규칙 · 채널 목록도 여기 둔다 (규칙 · 채널 탭 가짜 응답이 이어서 쓴다)
import { http } from 'msw'
import { API_BASE } from '../client'
import type { AlertEvent, AlertEventDetail, AlertNotification, ChannelType, MetricKind, NotifyResult, Operator, Severity } from '../alerts'
import { fail, ok, okPage, unauthenticated } from './common'

const MIN = 60_000
const uuid = (kind: number, i: number) => `7c1e0a52-000${kind}-4a00-9000-0000000000${String(i).padStart(2, '0')}`

export type MockRule = {
  alert_rule_uuid: string
  service_name: string
  name: string
  metric_kind: MetricKind
  operator: Operator
  threshold: number
  window_sec: number
  severity: Severity
}

export const RULES: MockRule[] = [
  { name: 'shop-payment 5xx 비율 초과', service_name: 'shop-payment', metric_kind: '5XX_RATE', operator: 'GT', threshold: 1, window_sec: 300, severity: 'CRITICAL' },
  { name: 'shop-order p95 지연', service_name: 'shop-order', metric_kind: 'P95_LATENCY', operator: 'GT', threshold: 800, window_sec: 300, severity: 'CRITICAL' },
  { name: 'shop-inventory 힙 사용률', service_name: 'shop-inventory', metric_kind: 'HEAP', operator: 'GT', threshold: 85, window_sec: 300, severity: 'WARNING' },
  { name: 'shop-gateway 에이전트 응답 없음', service_name: 'shop-gateway', metric_kind: 'AGENT_DOWN', operator: 'GT', threshold: 60, window_sec: 60, severity: 'CRITICAL' },
  { name: 'shop-user CPU 사용률', service_name: 'shop-user', metric_kind: 'CPU', operator: 'GT', threshold: 80, window_sec: 300, severity: 'WARNING' },
  { name: 'shop-order GC 시간', service_name: 'shop-order', metric_kind: 'GC_TIME', operator: 'GT', threshold: 1000, window_sec: 600, severity: 'WARNING' },
  { name: 'shop-user 4xx 비율', service_name: 'shop-user', metric_kind: '4XX_RATE', operator: 'GT', threshold: 5, window_sec: 300, severity: 'INFO' },
].map((r, i) => ({ ...r, alert_rule_uuid: `5b2d0a52-0000-4a00-9000-0000000000${String(i + 1).padStart(2, '0')}` }) as MockRule)

export type MockChannel = { alert_channel_uuid: string; name: string; type: ChannelType }

export const CHANNELS: MockChannel[] = [
  { name: '#ops-alerts', type: 'SLACK' },
  { name: 'oncall@monimo.io', type: 'EMAIL' },
  { name: 'PagerDuty prod', type: 'PAGERDUTY' },
  { name: 'Webhook n8n', type: 'WEBHOOK' },
].map((c, i) => ({ ...c, alert_channel_uuid: `9d4e0a52-0000-4a00-9000-0000000000${String(i + 1).padStart(2, '0')}` }) as MockChannel)

type Seed = { rule: number; agent?: string; value: number; firedAgoMin: number; resolvedAgoMin?: number }

// rule 은 RULES 순번
const SEEDS: Seed[] = [
  { rule: 0, value: 4.2, firedAgoMin: 18 },
  { rule: 1, value: 1240, firedAgoMin: 12 },
  { rule: 2, agent: 'shop-inventory-7d9f4-x2k8q', value: 91.3, firedAgoMin: 6 },
  { rule: 3, agent: 'shop-gateway-7d9f4-m4p1z', value: 92, firedAgoMin: 67, resolvedAgoMin: 55 },
  { rule: 4, agent: 'shop-user-7d9f4-m4p1z', value: 88.6, firedAgoMin: 86, resolvedAgoMin: 70 },
  { rule: 5, agent: 'shop-order-7d9f4-q4t0b', value: 1310, firedAgoMin: 114, resolvedAgoMin: 96 },
  { rule: 6, value: 6.8, firedAgoMin: 157, resolvedAgoMin: 150 },
  { rule: 0, value: 2.6, firedAgoMin: 336, resolvedAgoMin: 310 },
]

function events(now: number): AlertEventDetail[] {
  return SEEDS.map((s, i) => {
    const rule = RULES[s.rule]
    return {
      alert_event_uuid: uuid(1, i + 1),
      alert_rule_uuid: rule.alert_rule_uuid,
      rule_name: rule.name,
      service_name: rule.service_name,
      agent_key: s.agent ?? null,
      fingerprint: [rule.service_name, rule.metric_kind, s.agent].filter(Boolean).join('|'),
      state: s.resolvedAgoMin === undefined ? 'FIRING' : 'RESOLVED',
      severity: rule.severity,
      observed_value: s.value,
      fired_at: new Date(now - s.firedAgoMin * MIN).toISOString(),
      resolved_at: s.resolvedAgoMin === undefined ? null : new Date(now - s.resolvedAgoMin * MIN).toISOString(),
      metric_kind: rule.metric_kind,
      operator: rule.operator,
      threshold: rule.threshold,
      window_sec: rule.window_sec,
    }
  })
}

/** 알림 발송 이력: 첫 경보는 시안처럼 채널 4개(PagerDuty 는 429 로 실패), 나머지는 Slack · Email 두 곳 */
function notifications(e: AlertEventDetail, index: number): AlertNotification[] {
  const fired = Date.parse(e.fired_at)
  const rows: [channel: number, result: NotifyResult, retry: number, response: string, afterSec: number][] =
    index === 0
      ? [
          [0, 'SUCCESS', 0, 'ok', 1],
          [1, 'SUCCESS', 0, '250 2.0.0 OK', 2],
          [2, 'FAIL', 2, '429 rate_limited', 6],
          [3, 'SUCCESS', 1, '200 accepted', 11],
        ]
      : [
          [0, 'SUCCESS', 0, 'ok', 1],
          [1, 'SUCCESS', 0, '250 2.0.0 OK', 2],
        ]
  return rows.map(([c, result, retry_count, response, afterSec], i) => ({
    notification_uuid: uuid(2, index * 10 + i + 1),
    alert_channel_uuid: CHANNELS[c].alert_channel_uuid,
    channel_name: CHANNELS[c].name,
    type: CHANNELS[c].type,
    result,
    retry_count,
    response,
    sent_at: new Date(fired + afterSec * 1000).toISOString(),
  }))
}

/** 목록 응답에는 규칙 조건(metric_kind 등)이 없다 (명세 16번) */
const toListItem = ({ metric_kind: _m, operator: _o, threshold: _t, window_sec: _w, ...rest }: AlertEventDetail): AlertEvent => rest

export const alertsHandlers = [
  // 목록: state 기본 FIRING, 최근 발화 순. from · to 는 fired_at 기준(선택)
  http.get(`${API_BASE}/alert-events`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const q = new URL(request.url).searchParams
    const state = q.get('state') ?? 'FIRING'
    const from = Date.parse(q.get('from') ?? '')
    const to = Date.parse(q.get('to') ?? '')
    const rows = events(Date.now())
      .filter(
        (e) =>
          e.state === state &&
          (!q.get('service_name') || e.service_name === q.get('service_name')) &&
          (!q.get('severity') || e.severity === q.get('severity')) &&
          (Number.isNaN(from) || Date.parse(e.fired_at) >= from) &&
          (Number.isNaN(to) || Date.parse(e.fired_at) < to),
      )
      .sort((a, b) => b.fired_at.localeCompare(a.fired_at))
      .map(toListItem)
    const limit = Math.min(Number(q.get('limit')) || 50, 500)
    const offset = Number(q.get('cursor')) || 0
    return okPage(rows.slice(offset, offset + limit), limit, offset + limit < rows.length ? String(offset + limit) : null)
  }),

  http.get(`${API_BASE}/alert-events/:uuid`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const e = events(Date.now()).find((x) => x.alert_event_uuid === params.uuid)
    return e ? ok(e) : fail(404, 'NOT_FOUND', '경보를 찾을 수 없습니다.')
  }),

  http.get(`${API_BASE}/alert-events/:uuid/notifications`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const all = events(Date.now())
    const i = all.findIndex((x) => x.alert_event_uuid === params.uuid)
    if (i === -1) return fail(404, 'NOT_FOUND', '경보를 찾을 수 없습니다.')
    const rows = notifications(all[i], i)
    return okPage(rows, 50)
  }),
]
