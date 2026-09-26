// 경보 가짜 응답 (GET /alert-events · /alert-events/:uuid · /alert-events/:uuid/notifications,
// /alert-rules 목록 · 상세 · 생성 · 수정 · 켜기/끄기 · 채널 교체, GET /alert-channels).
// 시안(Alerts.dc.html)의 이벤트 8건 — 발화 중 3 · 해소 5. 시각은 지금 기준(몇 분 전)으로 만든다.
// 규칙 · 채널은 메모리 배열이라 고치면 새로고침 전까지 남는다 (경보 상세도 바뀐 규칙 이름 · 조건을 따라간다)
import { http } from 'msw'
import { API_BASE } from '../client'
import type { AlertChannelRef, AlertEvent, AlertEventDetail, AlertNotification, AlertRule, AlertRuleBody, ChannelType, MetricKind, NotifyResult, Operator, Severity } from '../alerts'
import { APPLICATIONS, fail, notAdmin, ok, okPage, unauthenticated } from './common'

const MIN = 60_000
const uuid = (kind: number, i: number) => `7c1e0a52-000${kind}-4a00-9000-0000000000${String(i).padStart(2, '0')}`

export type MockRule = {
  alert_rule_uuid: string
  application_uuid: string
  service_name: string
  name: string
  metric_kind: MetricKind
  operator: Operator
  threshold: number
  window_sec: number
  severity: Severity
  enabled: boolean
  /** 연결된 채널 uuid */
  channels: string[]
  created_at: string
  updated_at: string
}

export type MockChannel = { alert_channel_uuid: string; name: string; type: ChannelType; enabled: boolean; created_at: string; updated_at: string }

export const CHANNELS: MockChannel[] = [
  { name: '#ops-alerts', type: 'SLACK' },
  { name: 'oncall@monimo.io', type: 'EMAIL' },
  { name: 'PagerDuty prod', type: 'PAGERDUTY' },
  { name: 'Webhook n8n', type: 'WEBHOOK' },
].map((c, i) => ({
  ...c,
  alert_channel_uuid: `9d4e0a52-0000-4a00-9000-0000000000${String(i + 1).padStart(2, '0')}`,
  enabled: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}) as MockChannel)

const appOf = (serviceName: string) => APPLICATIONS.find((a) => a.name === serviceName)!.application_uuid

// 시안(AlertRules.dc.html)의 규칙 8개. 앞 7개는 아래 경보 이벤트가 순번으로 가리킨다. 수정 · 켜기/끄기는 이 배열을 그대로 고친다
// chs 는 CHANNELS 순번 — 경보 이벤트의 알림 발송 이력과 맞춘다 (첫 규칙 · 에이전트 끊김은 4곳, 나머지는 Slack · Email)
export const RULES: MockRule[] = [
  { name: 'shop-payment 5xx 비율 초과', service_name: 'shop-payment', metric_kind: '5XX_RATE', operator: 'GT', threshold: 1, window_sec: 300, severity: 'CRITICAL', chs: [0, 1, 2, 3], at: '2026-09-21T04:40:12Z' },
  { name: 'shop-order p95 지연', service_name: 'shop-order', metric_kind: 'P95_LATENCY', operator: 'GT', threshold: 1200, window_sec: 300, severity: 'CRITICAL', chs: [0, 1], at: '2026-09-21T02:02:55Z' },
  { name: 'shop-inventory 힙 사용률', service_name: 'shop-inventory', metric_kind: 'HEAP', operator: 'GTE', threshold: 85, window_sec: 600, severity: 'WARNING', chs: [0, 1], at: '2026-09-20T08:26:41Z' },
  { name: 'shop-gateway 에이전트 응답 없음', service_name: 'shop-gateway', metric_kind: 'AGENT_DOWN', operator: 'GT', threshold: 90, window_sec: 60, severity: 'CRITICAL', chs: [0, 1, 2, 3], at: '2026-09-16T07:05:33Z' },
  { name: 'shop-user CPU 사용률', service_name: 'shop-user', metric_kind: 'CPU', operator: 'GTE', threshold: 85, window_sec: 600, severity: 'WARNING', chs: [0, 1], at: '2026-09-19T00:51:07Z' },
  { name: 'shop-order GC 시간', service_name: 'shop-order', metric_kind: 'GC_TIME', operator: 'GT', threshold: 1000, window_sec: 300, severity: 'WARNING', chs: [0, 1], at: '2026-09-18T05:33:20Z', off: true },
  { name: 'shop-user 4xx 비율', service_name: 'shop-user', metric_kind: '4XX_RATE', operator: 'GT', threshold: 5, window_sec: 900, severity: 'INFO', chs: [0, 1], at: '2026-09-17T01:12:48Z', off: true },
  { name: 'shop-gateway 5xx 비율 초과', service_name: 'shop-gateway', metric_kind: '5XX_RATE', operator: 'GT', threshold: 2, window_sec: 300, severity: 'CRITICAL', chs: [0, 1, 3], at: '2026-09-15T02:44:02Z' },
].map(({ chs, at, off, ...r }, i) => ({
  ...r,
  alert_rule_uuid: `5b2d0a52-0000-4a00-9000-0000000000${String(i + 1).padStart(2, '0')}`,
  application_uuid: appOf(r.service_name),
  enabled: !off,
  channels: chs.map((c) => CHANNELS[c].alert_channel_uuid),
  created_at: '2026-09-01T00:00:00Z',
  updated_at: at,
}) as MockRule)

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

// ── 규칙 ──

const METRIC_KINDS: MetricKind[] = ['5XX_RATE', '4XX_RATE', 'P95_LATENCY', 'CPU', 'HEAP', 'GC_TIME', 'AGENT_DOWN']
const OPERATORS: Operator[] = ['GT', 'GTE', 'LT', 'LTE']
const SEVERITIES: Severity[] = ['CRITICAL', 'WARNING', 'INFO']

const channelRefs = (uuids: string[]): AlertChannelRef[] =>
  uuids.flatMap((id) => {
    const c = CHANNELS.find((x) => x.alert_channel_uuid === id)
    return c ? [{ alert_channel_uuid: c.alert_channel_uuid, name: c.name, type: c.type }] : []
  })

const toRule = (r: MockRule): AlertRule => ({ ...r, channels: channelRefs(r.channels) })

/** 수정 · 생성 본문 검사. 틀리면 400 INVALID_REQUEST 응답, 맞으면 null */
function invalidBody(b: Partial<AlertRuleBody> | null) {
  const bad = (msg: string) => fail(400, 'INVALID_REQUEST', msg)
  if (!b) return bad('본문이 없습니다.')
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name || name.length > 200) return bad('name 은 1~200자여야 합니다.')
  if (!METRIC_KINDS.includes(b.metric_kind as MetricKind)) return bad('metric_kind 가 올바르지 않습니다.')
  if (!OPERATORS.includes(b.operator as Operator)) return bad('operator 가 올바르지 않습니다.')
  if (typeof b.threshold !== 'number' || !Number.isFinite(b.threshold) || b.threshold < 0) return bad('threshold 는 0 이상의 숫자여야 합니다.')
  if (!Number.isInteger(b.window_sec) || b.window_sec! < 60 || b.window_sec! > 3600) return bad('window_sec 는 60~3600 사이 정수여야 합니다.')
  if (!SEVERITIES.includes(b.severity as Severity)) return bad('severity 가 올바르지 않습니다.')
  return null
}

const unknownChannel = (ids: unknown) =>
  !Array.isArray(ids) || ids.some((id) => !CHANNELS.some((c) => c.alert_channel_uuid === id))
    ? fail(400, 'INVALID_REQUEST', 'channel_uuids 에 없는 채널이 있습니다.')
    : null

const findRule = (id: unknown) => RULES.find((r) => r.alert_rule_uuid === id)
const ruleNotFound = () => fail(404, 'NOT_FOUND', '규칙을 찾을 수 없습니다.')

export const rulesHandlers = [
  // 목록: 최근 고친 순. service_name · enabled(true/false) · severity 로 거른다
  http.get(`${API_BASE}/alert-rules`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const q = new URL(request.url).searchParams
    const enabled = q.get('enabled')
    const rows = RULES.filter(
      (r) =>
        (!q.get('service_name') || r.service_name === q.get('service_name')) &&
        (enabled === null || String(r.enabled) === enabled) &&
        (!q.get('severity') || r.severity === q.get('severity')),
    )
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map(toRule)
    const limit = Math.min(Number(q.get('limit')) || 50, 500)
    const offset = Number(q.get('cursor')) || 0
    return okPage(rows.slice(offset, offset + limit), limit, offset + limit < rows.length ? String(offset + limit) : null)
  }),

  http.get(`${API_BASE}/alert-rules/:uuid`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const r = findRule(params.uuid)
    return r ? ok(toRule(r)) : ruleNotFound()
  }),

  http.get(`${API_BASE}/alert-rules/:uuid/channels`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const r = findRule(params.uuid)
    return r ? ok({ alert_rule_uuid: r.alert_rule_uuid, channels: channelRefs(r.channels) }) : ruleNotFound()
  }),

  http.post(`${API_BASE}/alert-rules`, async ({ request }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const b = (await request.json().catch(() => null)) as (AlertRuleBody & { application_uuid?: string; enabled?: boolean; channel_uuids?: string[] }) | null
    const invalid = invalidBody(b) ?? unknownChannel(b!.channel_uuids ?? [])
    if (invalid) return invalid
    const ids = b!.channel_uuids ?? []
    if (new Set(ids).size !== ids.length) return fail(409, 'RULE_CHANNEL_DUPLICATE', '같은 채널을 두 번 연결할 수 없습니다.')
    const app = APPLICATIONS.find((a) => a.application_uuid === b!.application_uuid)
    if (!app) return fail(400, 'INVALID_REQUEST', 'application_uuid 가 올바르지 않습니다.')
    const now = new Date().toISOString()
    const rule: MockRule = {
      alert_rule_uuid: crypto.randomUUID(),
      application_uuid: app.application_uuid,
      service_name: app.name,
      name: b!.name.trim(),
      metric_kind: b!.metric_kind,
      operator: b!.operator,
      threshold: b!.threshold,
      window_sec: b!.window_sec,
      severity: b!.severity,
      enabled: b!.enabled !== false,
      channels: ids,
      created_at: now,
      updated_at: now,
    }
    RULES.push(rule)
    return ok(toRule(rule), 201)
  }),

  http.put(`${API_BASE}/alert-rules/:uuid`, async ({ request, params }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const r = findRule(params.uuid)
    if (!r) return ruleNotFound()
    const b = (await request.json().catch(() => null)) as AlertRuleBody | null
    const invalid = invalidBody(b)
    if (invalid) return invalid
    Object.assign(r, {
      name: b!.name.trim(),
      metric_kind: b!.metric_kind,
      operator: b!.operator,
      threshold: b!.threshold,
      window_sec: b!.window_sec,
      severity: b!.severity,
      updated_at: new Date().toISOString(),
    })
    return ok(toRule(r))
  }),

  http.patch(`${API_BASE}/alert-rules/:uuid/enabled`, async ({ request, params }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const r = findRule(params.uuid)
    if (!r) return ruleNotFound()
    const b = (await request.json().catch(() => null)) as { enabled?: unknown } | null
    if (typeof b?.enabled !== 'boolean') return fail(400, 'INVALID_REQUEST', 'enabled 는 true/false 여야 합니다.')
    // updated_at 은 기준값 · 구간을 바꾼 시각이라(erd.md) 켜고 끄기만으로는 바꾸지 않는다 — 표 순서도 그대로
    r.enabled = b.enabled
    return ok({ alert_rule_uuid: r.alert_rule_uuid, enabled: r.enabled, updated_at: r.updated_at })
  }),

  // 연결 전체 교체. 같은 채널이 두 번 오면 명세의 409 RULE_CHANNEL_DUPLICATE
  http.put(`${API_BASE}/alert-rules/:uuid/channels`, async ({ request, params }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const r = findRule(params.uuid)
    if (!r) return ruleNotFound()
    const b = (await request.json().catch(() => null)) as { channel_uuids?: string[] } | null
    const invalid = unknownChannel(b?.channel_uuids)
    if (invalid) return invalid
    const ids = b!.channel_uuids!
    if (new Set(ids).size !== ids.length) return fail(409, 'RULE_CHANNEL_DUPLICATE', '같은 채널을 두 번 연결할 수 없습니다.')
    r.channels = ids
    return ok({ alert_rule_uuid: r.alert_rule_uuid, channels: channelRefs(r.channels) })
  }),

  // 채널 목록 (규칙 모달의 채널 고르기). type · enabled 로 거른다
  http.get(`${API_BASE}/alert-channels`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const q = new URL(request.url).searchParams
    const enabled = q.get('enabled')
    const rows = CHANNELS.filter((c) => (!q.get('type') || c.type === q.get('type')) && (enabled === null || String(c.enabled) === enabled))
    return okPage(rows, Math.min(Number(q.get('limit')) || 50, 500))
  }),
]
