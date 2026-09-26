// 실패한 요청의 상태코드 · 예외 타입 · 메시지를 한 곳에서 정한다 (가짜 응답 공용).
// 트랜잭션 목록의 http_status, 트레이스 상세의 예외 이벤트, 에러 분석 표가 모두 이 값을 쓰므로 서로 어긋나지 않는다.
// trace_id 를 씨앗으로 고르므로 같은 요청이면 늘 같은 실패다
import { seeded } from './common'

export type Failure = { http_status: number; exception_type: string; exception_message: string }

type Row = [weight: number, status: number, type: string, message: string]

const CATALOG: Record<string, Row[]> = {
  'shop-order': [
    [3, 500, 'PaymentDeclinedException', '카드사 승인 거절 (issuer=KB, code=51)'],
    [2, 500, 'SQLTimeoutException', 'Pool empty. Unable to fetch a connection in 30 seconds'],
    [2, 422, 'HttpClientErrorException', '422 Unprocessable: coupon expired'],
    [1, 500, 'NullPointerException', 'Cannot invoke "Coupon.getRate()" because "coupon" is null'],
    [2, 409, 'OptimisticLockException', 'order 3f1a…9c2e was updated by another transaction'],
  ],
  'shop-payment': [
    [4, 500, 'PaymentDeclinedException', 'declined by issuer: insufficient funds (code=51)'],
    [2, 422, 'HttpClientErrorException', '422 Unprocessable: invalid card number'],
    [1, 504, 'SocketTimeoutException', 'Read timed out after 3000ms (pg-gateway.example.com)'],
  ],
  'shop-gateway': [
    [3, 502, 'HttpClientErrorException', '502 Bad Gateway from shop-order'],
    [2, 401, 'HttpClientErrorException', '401 Unauthorized: token expired'],
    [1, 504, 'SocketTimeoutException', 'upstream shop-order timed out after 5000ms'],
  ],
  'shop-inventory': [
    [3, 500, 'SQLTimeoutException', 'Statement cancelled due to timeout (stock_reserve)'],
    [2, 409, 'OutOfStockException', 'sku 88213 has 0 left'],
  ],
  'shop-user': [
    [3, 401, 'HttpClientErrorException', '401 Unauthorized: session not found'],
    [1, 404, 'UserNotFoundException', 'user 51920 not found'],
  ],
}
const FALLBACK: Row[] = [[1, 500, 'RuntimeException', 'unexpected error']]

export function failureOf(service: string, traceId: string): Failure {
  const rows = CATALOG[service] ?? FALLBACK
  const total = rows.reduce((s, [w]) => s + w, 0)
  let pick = seeded(`fail|${traceId}`)() * total
  for (const [w, http_status, exception_type, exception_message] of rows) {
    pick -= w
    if (pick < 0) return { http_status, exception_type, exception_message }
  }
  const [, http_status, exception_type, exception_message] = rows[0]
  return { http_status, exception_type, exception_message }
}
