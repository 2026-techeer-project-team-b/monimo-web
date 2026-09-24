// URL 통계 가짜 응답 (GET /stats/urls). 시안의 1시간 값(shop-order 는 시안 숫자 그대로), 시간 범위에 비례
import { http } from 'msw'
import { API_BASE } from '../client'
import type { UrlStat } from '../stats'
import { okPage, timeRange, unauthenticated } from './common'

type Row = [span: string, cnt: number, err: number, p50: number, p95: number, p99: number]
const HOUR: Record<string, Row[]> = {
  'shop-gateway': [
    ['GET /orders/**', 6980, 210, 180, 420, 910],
    ['POST /orders/**', 3610, 188, 260, 980, 1620],
    ['GET /users/**', 1950, 6, 22, 61, 140],
  ],
  'shop-order': [
    ['GET /api/v1/orders/{orderId}', 4120, 38, 96, 312, 640],
    ['POST /api/v1/orders', 3480, 351, 310, 864, 1410],
    ['GET /api/v1/orders', 2940, 9, 88, 268, 520],
    ['PATCH /api/v1/orders/{orderId}/status', 1210, 4, 70, 190, 330],
    ['DELETE /api/v1/orders/{orderId}', 730, 0, 64, 150, 260],
  ],
  'shop-payment': [
    ['POST /api/v1/payments', 6720, 381, 340, 1120, 1880],
    ['GET /api/v1/payments/{paymentId}', 2890, 21, 45, 130, 260],
  ],
  'shop-inventory': [
    ['GET /api/v1/stock/{sku}', 6300, 3, 21, 70, 140],
    ['POST /api/v1/stock/reserve', 2920, 11, 55, 180, 350],
  ],
  'shop-user': [
    ['GET /api/v1/users/{userId}', 4210, 2, 12, 34, 70],
    ['GET /api/v1/users/me', 1930, 1, 10, 30, 62],
  ],
}

export const statsHandlers = [
  http.get(`${API_BASE}/stats/urls`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const url = new URL(request.url)
    const range = timeRange(url)
    if (range instanceof Response) return range
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500)
    const rows: UrlStat[] = (HOUR[url.searchParams.get('service_name') ?? ''] ?? [])
      .map(([span_name, cnt, err, p50_ms, p95_ms, p99_ms]) => {
        const c = Math.round(cnt * range.hours)
        const e = Math.round(err * range.hours)
        return { span_name, cnt: c, err_cnt: e, error_rate: c ? e / c : 0, p50_ms, p95_ms, p99_ms }
      })
      .sort((a, b) => b.cnt - a.cnt)
    // 가짜 응답은 한 쪽이면 다 들어가는 크기라 커서는 쓰지 않는다
    return okPage(rows.slice(0, limit), limit, rows.length > limit ? 'mock-next' : null)
  }),
]
