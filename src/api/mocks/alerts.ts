// 경보 이벤트 가짜 응답 (GET /alert-events). 시안의 발화 중 3건 + 해소된 1건. 시각은 지금 기준
import { http } from 'msw'
import { API_BASE } from '../client'
import type { AlertEvent } from '../alerts'
import { okPage, unauthenticated } from './common'

const MIN = 60_000
const EVENTS: (Omit<AlertEvent, 'fired_at' | 'resolved_at'> & { firedAgoMin: number; resolvedAgoMin?: number })[] = [
  { alert_event_uuid: '7c1e0a52-0000-4a00-9000-000000000001', alert_rule_uuid: '5b2d0a52-0000-4a00-9000-000000000001', rule_name: '결제 5xx 비율', service_name: 'shop-payment', agent_key: null, fingerprint: 'shop-payment|5XX_RATE', state: 'FIRING', severity: 'CRITICAL', observed_value: 4.2, firedAgoMin: 18 },
  { alert_event_uuid: '7c1e0a52-0000-4a00-9000-000000000002', alert_rule_uuid: '5b2d0a52-0000-4a00-9000-000000000002', rule_name: '주문 p95 지연', service_name: 'shop-order', agent_key: null, fingerprint: 'shop-order|P95_LATENCY', state: 'FIRING', severity: 'CRITICAL', observed_value: 1240, firedAgoMin: 12 },
  { alert_event_uuid: '7c1e0a52-0000-4a00-9000-000000000003', alert_rule_uuid: '5b2d0a52-0000-4a00-9000-000000000003', rule_name: '재고 힙 사용률', service_name: 'shop-inventory', agent_key: 'shop-inventory-7d9f4-x2k8q', fingerprint: 'shop-inventory|HEAP|shop-inventory-7d9f4-x2k8q', state: 'FIRING', severity: 'WARNING', observed_value: 91.3, firedAgoMin: 6 },
  { alert_event_uuid: '7c1e0a52-0000-4a00-9000-000000000004', alert_rule_uuid: '5b2d0a52-0000-4a00-9000-000000000004', rule_name: '회원 CPU', service_name: 'shop-user', agent_key: 'shop-user-7d9f4-m4p1z', fingerprint: 'shop-user|CPU|shop-user-7d9f4-m4p1z', state: 'RESOLVED', severity: 'WARNING', observed_value: 83.5, firedAgoMin: 95, resolvedAgoMin: 70 },
]

export const alertsHandlers = [
  http.get(`${API_BASE}/alert-events`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const q = new URL(request.url).searchParams
    const state = q.get('state') ?? 'FIRING'
    const limit = Math.min(Number(q.get('limit')) || 50, 500)
    const now = Date.now()
    // from · to 는 선택 값이다. 오면 fired_at 이 그 안에 드는 것만 준다
    const from = Date.parse(q.get('from') ?? '')
    const to = Date.parse(q.get('to') ?? '')
    const inRange = (firedAgoMin: number) => {
      const t = now - firedAgoMin * MIN
      return (Number.isNaN(from) || t >= from) && (Number.isNaN(to) || t < to)
    }
    const rows: AlertEvent[] = EVENTS.filter(
      (e) => e.state === state && (!q.get('service_name') || e.service_name === q.get('service_name')) && (!q.get('severity') || e.severity === q.get('severity')) && inRange(e.firedAgoMin),
    ).map(({ firedAgoMin, resolvedAgoMin, ...e }) => ({
      ...e,
      fired_at: new Date(now - firedAgoMin * MIN).toISOString(),
      resolved_at: resolvedAgoMin === undefined ? null : new Date(now - resolvedAgoMin * MIN).toISOString(),
    }))
    return okPage(rows.slice(0, limit), limit, rows.length > limit ? 'mock-next' : null)
  }),
]
