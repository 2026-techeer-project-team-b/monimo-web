// 가짜 응답 목록 (MSW). VITE_API_MOCK=true 로 개발 서버를 켰을 때만 쓴다.
// 응답 모양은 백엔드 명세(monimo-backend docs/design/web-v2/api-spec.md §0)를 따른다: { data } · { error: { code, message } }
// 화면 작업에서 필요한 엔드포인트는 화면별 파일(mocks/<화면>.ts)에 만들고 아래 handlers 에 펼쳐 넣는다.
import { http, HttpResponse } from 'msw'
import { API_BASE } from '../client'
import { ACCESS_TTL_SEC, accessTokens, currentUser, fail, issueAccess, ok, PASSWORD, reqId, USERS } from './common'
import { serverMapHandlers } from './serverMap'

// refresh → user_uuid. 실제 서버처럼 새로고침 뒤에도 남도록 sessionStorage 에 둔다 (가짜 응답 전용)
const MOCK_REFRESH_KEY = 'monimo.mock.refresh_tokens'
const refreshTokens = {
  read: (): Record<string, string> => JSON.parse(sessionStorage.getItem(MOCK_REFRESH_KEY) ?? '{}'),
  get: (token: string) => refreshTokens.read()[token],
  set: (token: string, userUuid: string) => sessionStorage.setItem(MOCK_REFRESH_KEY, JSON.stringify({ ...refreshTokens.read(), [token]: userUuid })),
  delete: (token: string) => {
    const all = refreshTokens.read()
    delete all[token]
    sessionStorage.setItem(MOCK_REFRESH_KEY, JSON.stringify(all))
  },
  clear: () => sessionStorage.removeItem(MOCK_REFRESH_KEY),
}

/** 개발 중 흐름 시험용 (브라우저 콘솔에서 __monimoMock.expireAccess() 등) */
export const mockControls = {
  /** 모든 access 토큰을 만료시킨다 → 다음 요청이 401 → 자동 재발급 */
  expireAccess: () => accessTokens.clear(),
  /** refresh 토큰도 무효로 만든다 → 재발급 실패 → 로그인 화면(세션 만료) */
  revokeRefresh: () => {
    accessTokens.clear()
    refreshTokens.clear()
  },
}

// ── 감시 대상 서비스 (로그인 시안의 쇼핑몰 5개) ──
const APPLICATIONS = ['shop-gateway', 'shop-order', 'shop-payment', 'shop-inventory', 'shop-user'].map((name, i) => ({
  application_uuid: `0b0e6a6e-2f00-4c1a-9a01-00000000000${i + 1}`,
  name,
  display_name: name,
  description: '',
  agent_count: 2,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}))

export const handlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null
    const user = USERS.find((u) => u.email === body?.email)
    if (!user || body?.password !== PASSWORD) return fail(401, 'UNAUTHENTICATED', '이메일 또는 비밀번호가 올바르지 않습니다.')
    const refresh = `mock-refresh.${crypto.randomUUID()}`
    refreshTokens.set(refresh, user.user_uuid)
    return ok({ access_token: issueAccess(user.user_uuid), refresh_token: refresh, expires_in: ACCESS_TTL_SEC, user })
  }),

  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { refresh_token?: string } | null
    const userUuid = body?.refresh_token ? refreshTokens.get(body.refresh_token) : undefined
    if (!userUuid) return fail(401, 'UNAUTHENTICATED', '재발급 토큰이 없거나 만료되었습니다.')
    return ok({ access_token: issueAccess(userUuid), expires_in: ACCESS_TTL_SEC })
  }),

  http.post(`${API_BASE}/auth/logout`, async ({ request }) => {
    if (!currentUser(request)) return fail(401, 'UNAUTHENTICATED', '로그인이 필요합니다.')
    const body = (await request.json().catch(() => null)) as { refresh_token?: string } | null
    if (body?.refresh_token) refreshTokens.delete(body.refresh_token)
    return ok({ result: 'LOGGED_OUT' })
  }),

  http.get(`${API_BASE}/applications`, ({ request }) => {
    if (!currentUser(request)) return fail(401, 'UNAUTHENTICATED', '로그인이 필요합니다.')
    return HttpResponse.json({ data: APPLICATIONS, page: { next_cursor: null, limit: 50 } }, { headers: { 'X-Request-Id': reqId() } })
  }),

  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const user = currentUser(request)
    return user ? ok(user) : fail(401, 'UNAUTHENTICATED', '로그인이 필요합니다.')
  }),

  ...serverMapHandlers,
]
