// 스캐터 가짜 응답 (GET /traces/scatter). 서비스별 호출 수 · 에러율은 서버맵 가짜 응답(HOUR)과 맞춘다.
// 점은 시간 범위 1분당 약 1.2개 — 시안처럼 뒤쪽 1/3 에서 실패 · 느린 요청이 몰린다
import { http } from 'msw'
import { API_BASE } from '../client'
import type { ScatterPoint } from '../traces'
import { ok, seeded, timeRange, unauthenticated } from './common'
import { HOUR } from './serverMap'

const SPANS: Record<string, string[]> = {
  'shop-gateway': ['GET /orders/**', 'POST /orders/**', 'GET /users/**'],
  'shop-order': ['GET /api/v1/orders/{orderId}', 'POST /api/v1/orders', 'GET /api/v1/orders'],
  'shop-payment': ['POST /api/v1/payments', 'GET /api/v1/payments/{paymentId}'],
  'shop-inventory': ['GET /api/v1/stock/{sku}', 'POST /api/v1/stock/reserve'],
  'shop-user': ['GET /api/v1/users/{userId}', 'GET /api/v1/users/me'],
}

export const tracesHandlers = [
  http.get(`${API_BASE}/traces/scatter`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const url = new URL(request.url)
    const range = timeRange(url)
    if (range instanceof Response) return range
    const service = url.searchParams.get('service_name') ?? ''
    const node = HOUR.nodes.find((n) => n.service_name === service)
    if (!node) return ok({ mode: 'raw', total_count: 0, points: [] })

    const limit = Math.min(Number(url.searchParams.get('limit')) || 5000, 5000)
    const want = Math.max(20, Math.round(range.hours * 60 * 1.2))
    const n = Math.min(want, limit)
    const base = HOUR.edges.find((e) => e.callee_service === service)?.avg_duration_ms ?? 120
    const failRate = Math.min(0.5, (node.err_cnt / node.cnt) * 8)
    const r = seeded(`${service}|${range.from}|${range.to}`)
    const spans = SPANS[service] ?? ['GET /']
    const points: ScatterPoint[] = Array.from({ length: n }, (_, i) => {
      const t = range.from + r() * (range.to - range.from)
      const late = t > range.from + (range.to - range.from) * 0.66
      const isError = late && r() < failRate
      const ms = isError ? 800 + r() * 500 : late && r() < 0.15 ? base * 1.5 + r() * base * 2 : base * (0.2 + r() * 0.5)
      const status = isError ? (r() < 0.8 ? 500 : 503) : 200
      return {
        trace_id: `${service.slice(5, 8)}${i.toString(16).padStart(4, '0')}${Math.floor(r() * 1e12).toString(16)}`,
        start_time: new Date(t).toISOString(),
        duration_ms: Math.round(ms),
        is_error: isError,
        http_status: status,
        span_name: spans[Math.floor(r() * spans.length)],
        agent_key: `${service}-7d9f4-${['x2k8q', 'm4p1z'][i % 2]}`,
      }
    })
    points.sort((a, b) => a.start_time.localeCompare(b.start_time))
    return ok({ mode: want > limit ? 'bucketed' : 'raw', total_count: Math.round(node.cnt * range.hours), points })
  }),
]
