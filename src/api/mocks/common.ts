// 가짜 응답 공통 도우미 — 응답 봉투 · 데모 계정 · access 토큰. 화면별 가짜 응답 파일(mocks/<화면>.ts)이 가져다 쓴다
import { HttpResponse } from 'msw'

export const reqId = () => crypto.randomUUID()
export const ok = (data: unknown, status = 200) => HttpResponse.json({ data }, { status, headers: { 'X-Request-Id': reqId() } })
export const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status, headers: { 'X-Request-Id': reqId() } })

// ── 인증 (데모 계정, 비밀번호는 모두 monimo2026) ──
export const USERS = [
  { user_uuid: '0b0e6a6e-1f00-4c1a-9a01-000000000001', email: 'admin@monimo.io', name: '김승조', role: 'ADMIN', created_at: '2026-09-01T00:00:00Z' },
  { user_uuid: '0b0e6a6e-1f00-4c1a-9a01-000000000002', email: 'viewer@monimo.io', name: '이뷰어', role: 'VIEWER', created_at: '2026-09-01T00:00:00Z' },
] as const

/** 감시 대상 서비스 5개 (GET /applications). 경보 규칙이 application_uuid 로 가리킨다. 등록 · 제외는 이 배열을 고친다 */
export const APPLICATIONS: { application_uuid: string; name: string; display_name: string; description: string; created_at: string; updated_at: string }[] = (
  [
    ['shop-gateway', '게이트웨이', '외부 요청을 받아 각 서비스로 나눠 보내는 입구.', '2026-09-18T00:22:10Z'],
    ['shop-order', '주문', '주문 접수 · 결제 요청 · 재고 차감을 묶어 처리하는 핵심 서비스. 카나리 주문이 통과하는 경로.', '2026-09-21T04:40:05Z'],
    ['shop-payment', '결제', 'PG 연동과 결제 승인 · 취소.', '2026-09-17T07:05:41Z'],
    ['shop-inventory', '재고', '상품별 재고 수량과 예약.', '2026-09-12T02:48:30Z'],
    ['shop-user', '회원', '가입 · 로그인 · 회원 정보.', '2026-09-08T05:30:12Z'],
  ] as const
).map(([name, display_name, description, updated_at], i) => ({
  application_uuid: `0b0e6a6e-2f00-4c1a-9a01-00000000000${i + 1}`,
  name,
  display_name,
  description,
  created_at: '2026-08-02T01:14:22Z',
  updated_at,
}))

export const PASSWORD = 'monimo2026'
export const ACCESS_TTL_SEC = 300

export const accessTokens = new Map<string, { userUuid: string; expiresAt: number }>()
export function issueAccess(userUuid: string) {
  const token = `mock-access.${crypto.randomUUID()}`
  accessTokens.set(token, { userUuid, expiresAt: Date.now() + ACCESS_TTL_SEC * 1000 })
  return token
}

export function currentUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  const entry = token ? accessTokens.get(token) : undefined
  if (!entry || entry.expiresAt < Date.now()) return null
  return USERS.find((u) => u.user_uuid === entry.userUuid) ?? null
}

/** 로그인이 안 됐으면 401 응답, 됐으면 null */
export const unauthenticated = (request: Request) => (currentUser(request) ? null : fail(401, 'UNAUTHENTICATED', '로그인이 필요합니다.'))

/** 목록 응답 { data, page } */
export const okPage = (data: unknown[], limit: number, nextCursor: string | null = null) =>
  HttpResponse.json({ data, page: { next_cursor: nextCursor, limit } }, { headers: { 'X-Request-Id': reqId() } })

/** 공통 시간 범위 from · to 를 읽는다. 없거나 from ≥ to 면 명세대로 422 UNPROCESSABLE 응답을 돌려준다 */
export function timeRange(url: URL): { from: number; to: number; hours: number } | Response {
  const from = Date.parse(url.searchParams.get('from') ?? '')
  const to = Date.parse(url.searchParams.get('to') ?? '')
  if (!(from < to)) return fail(422, 'UNPROCESSABLE', 'from 은 to 보다 앞이어야 합니다.')
  return { from, to, hours: (to - from) / 3_600_000 }
}

/** 고정 씨앗 난수 — 같은 입력이면 늘 같은 가짜 데이터 */
export function seeded(text: string) {
  let s = [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
}

/** 관리자만 하는 변경(생성 · 수정 · 켜기/끄기)이면: 로그인 안 됐으면 401, VIEWER 면 403 FORBIDDEN, ADMIN 이면 null */
export function notAdmin(request: Request) {
  const user = currentUser(request)
  if (!user) return fail(401, 'UNAUTHENTICATED', '로그인이 필요합니다.')
  return user.role === 'ADMIN' ? null : fail(403, 'FORBIDDEN', '관리자(ADMIN)만 바꿀 수 있습니다.')
}
