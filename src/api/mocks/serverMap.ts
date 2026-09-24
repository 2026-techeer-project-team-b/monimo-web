// 서버맵 가짜 응답 (GET /server-map). 숫자는 시안(ServerMap.dc.html) 의 1시간 값이고, 시간 범위 길이에 비례해 늘리거나 줄인다
import { http } from 'msw'
import { API_BASE } from '../client'
import type { ServerMap } from '../serverMap'
import { fail, ok, unauthenticated } from './common'

const HOUR: ServerMap = {
  nodes: [
    { service_name: 'shop-gateway', cnt: 12540, err_cnt: 404 },
    { service_name: 'shop-order', cnt: 12480, err_cnt: 402 },
    { service_name: 'shop-payment', cnt: 9610, err_cnt: 402 },
    { service_name: 'shop-inventory', cnt: 9220, err_cnt: 14 },
    { service_name: 'shop-user', cnt: 6140, err_cnt: 3 },
  ],
  edges: [
    { caller_service: 'shop-gateway', callee_service: 'shop-order', callee_kind: 'SERVICE', cnt: 12410, err_cnt: 12, avg_duration_ms: 214 },
    { caller_service: 'shop-order', callee_service: 'shop-payment', callee_kind: 'SERVICE', cnt: 9580, err_cnt: 402, avg_duration_ms: 386 },
    { caller_service: 'shop-order', callee_service: 'shop-inventory', callee_kind: 'SERVICE', cnt: 9200, err_cnt: 14, avg_duration_ms: 63 },
    { caller_service: 'shop-order', callee_service: 'shop-user', callee_kind: 'SERVICE', cnt: 6120, err_cnt: 3, avg_duration_ms: 28 },
    { caller_service: 'shop-order', callee_service: 'orders-db', callee_kind: 'DB', cnt: 24860, err_cnt: 5, avg_duration_ms: 11 },
    { caller_service: 'shop-payment', callee_service: 'pg-gateway.example.com', callee_kind: 'EXTERNAL', cnt: 9450, err_cnt: 388, avg_duration_ms: 341 },
  ],
}

export const serverMapHandlers = [
  // 실제 서버는 service_name 이 오면 그 서비스와 이어진 부분만 줄 수 있다. 가짜 응답은 5개가 모두 이어져 있어 전체를 준다
  http.get(`${API_BASE}/server-map`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const url = new URL(request.url)
    const from = Date.parse(url.searchParams.get('from') ?? '')
    const to = Date.parse(url.searchParams.get('to') ?? '')
    if (!(from < to)) return fail(400, 'INVALID_REQUEST', 'from 은 to 보다 앞이어야 합니다.')
    const k = (to - from) / 3_600_000
    const scale = (n: number) => Math.round(n * k)
    return ok({
      nodes: HOUR.nodes.map((n) => ({ ...n, cnt: scale(n.cnt), err_cnt: scale(n.err_cnt) })),
      edges: HOUR.edges.map((e) => ({ ...e, cnt: scale(e.cnt), err_cnt: scale(e.err_cnt) })),
    })
  }),
]
