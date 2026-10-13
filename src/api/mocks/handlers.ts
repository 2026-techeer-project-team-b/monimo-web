// 가짜 응답 목록 (MSW). VITE_API_MOCK=true 로 개발 서버를 켰을 때만 쓴다.
// 응답 모양은 백엔드 명세(monimo-backend docs/design/web-v2/api-spec.md §0)를 따른다: { data } · { error: { code, message } }
// 화면 작업에서 필요한 엔드포인트는 화면별 파일(mocks/<화면>.ts)에 만들고 아래 handlers 에 펼쳐 넣는다.
import { http, HttpResponse } from 'msw'
import { API_BASE } from '../client'
import { ACCESS_TTL_SEC, accessTokens, currentUser, fail, issueAccess, ok, PASSWORD, reqId, unauthenticated, USERS } from './common'
import { agentsHandlers } from './agents'
import { applicationsHandlers } from './applications'
import { alertsHandlers, channelsHandlers, rulesHandlers } from './alerts'
import { errorsHandlers } from './errors'
import { logsHandlers } from './logs'
import { metricsHandlers } from './metrics'
import { threadDumpsHandlers } from './threadDumps'
import { serverMapHandlers } from './serverMap'
import { statsHandlers } from './stats'
import { traceDetailHandlers } from './traceDetail'
import { tracesHandlers } from './traces'

// refresh → user_uuid. 실제 서버처럼 refresh 는 httpOnly 쿠키(monimo_refresh)로 오가고, 표는 새로고침 뒤에도 남도록 sessionStorage 에 둔다 (가짜 응답 전용).
// 테스트(Node)에는 sessionStorage 가 없어서 메모리 Map 을 대신 쓴다
const MOCK_REFRESH_KEY = 'monimo.mock.refresh_tokens'
const memory = new Map<string, string>()
const store = {
  getItem: (k: string) => (typeof sessionStorage === 'undefined' ? (memory.get(k) ?? null) : sessionStorage.getItem(k)),
  setItem: (k: string, v: string) => (typeof sessionStorage === 'undefined' ? void memory.set(k, v) : sessionStorage.setItem(k, v)),
  removeItem: (k: string) => (typeof sessionStorage === 'undefined' ? void memory.delete(k) : sessionStorage.removeItem(k)),
}
const refreshTokens = {
  read: (): Record<string, string> => JSON.parse(store.getItem(MOCK_REFRESH_KEY) ?? '{}'),
  get: (token: string) => refreshTokens.read()[token],
  set: (token: string, userUuid: string) => store.setItem(MOCK_REFRESH_KEY, JSON.stringify({ ...refreshTokens.read(), [token]: userUuid })),
  delete: (token: string) => {
    const all = refreshTokens.read()
    delete all[token]
    store.setItem(MOCK_REFRESH_KEY, JSON.stringify(all))
  },
  clear: () => store.removeItem(MOCK_REFRESH_KEY),
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

// 실제 서버의 쿠키 속성과 같다 (backend RefreshCookie). 로컬은 http 라 Secure 를 안 붙인다.
// Path 는 경로만 — 테스트에서는 API_BASE 가 절대 주소(http://localhost/api/v1)라 그대로 쓰면 쿠키가 안 붙는다
const REFRESH_COOKIE = 'monimo_refresh'
const COOKIE_PATH = `${new URL(API_BASE, 'http://localhost').pathname}/auth`
const cookieOf = (value: string, maxAge: number) => `${REFRESH_COOKIE}=${value}; Path=${COOKIE_PATH}; Max-Age=${maxAge}; HttpOnly; SameSite=Strict`
// Set-Cookie 는 응답을 만들 때 헤더로 넣어야 MSW 가 쿠키 저장소에 담는다 (만든 뒤 append 하면 무시된다)
const okWithCookie = (data: unknown, cookie: string) => HttpResponse.json({ data }, { headers: { 'X-Request-Id': reqId(), 'Set-Cookie': cookie } })

export const handlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null
    const user = USERS.find((u) => u.email === body?.email)
    if (!user || body?.password !== PASSWORD) return fail(401, 'UNAUTHENTICATED', '이메일 또는 비밀번호가 올바르지 않습니다.')
    const refresh = `mock-refresh.${crypto.randomUUID()}`
    refreshTokens.set(refresh, user.user_uuid)
    return okWithCookie({ access_token: issueAccess(user.user_uuid), expires_in: ACCESS_TTL_SEC, user }, cookieOf(refresh, 14 * 24 * 3600))
  }),

  // 재발급: 본문 없음, 쿠키만 본다. 성공하면 refresh 를 회전한다 (쓴 것은 지우고 새 쿠키)
  http.post(`${API_BASE}/auth/refresh`, ({ cookies }) => {
    const used = cookies[REFRESH_COOKIE]
    const userUuid = used ? refreshTokens.get(used) : undefined
    if (!userUuid) return fail(401, 'UNAUTHENTICATED', '재발급 토큰이 없거나 만료되었습니다.')
    refreshTokens.delete(used!)
    const next = `mock-refresh.${crypto.randomUUID()}`
    refreshTokens.set(next, userUuid)
    return okWithCookie({ access_token: issueAccess(userUuid), expires_in: ACCESS_TTL_SEC }, cookieOf(next, 14 * 24 * 3600))
  }),

  http.post(`${API_BASE}/auth/logout`, ({ request, cookies }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const used = cookies[REFRESH_COOKIE]
    if (used) refreshTokens.delete(used)
    return okWithCookie({ result: 'LOGGED_OUT' }, cookieOf('', 0))
  }),

  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const user = currentUser(request)
    return user ? ok(user) : fail(401, 'UNAUTHENTICATED', '로그인이 필요합니다.')
  }),

  ...applicationsHandlers,
  ...serverMapHandlers,
  ...tracesHandlers,
  // /traces/:traceId 는 반드시 tracesHandlers(/traces/scatter 등) 뒤에
  ...traceDetailHandlers,
  ...statsHandlers,
  ...alertsHandlers,
  ...rulesHandlers,
  ...channelsHandlers,
  ...agentsHandlers,
  ...metricsHandlers,
  ...threadDumpsHandlers,
  ...errorsHandlers,
  ...logsHandlers,
]
