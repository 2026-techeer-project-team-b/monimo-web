// 인증 문 4개 (api-spec 20 · 28 · 31 · 32번)
import { api, ApiError, refreshAccessToken } from './client'
import { tokens } from './tokens'

export type Role = 'ADMIN' | 'VIEWER'

export type User = {
  user_uuid: string
  email: string
  /** 서버가 이름 없이 만든 계정이면 null */
  name: string | null
  role: Role
  created_at?: string
}

/** refresh 토큰은 본문에 없다. 서버가 Set-Cookie 로 심는다 */
type LoginData = { access_token: string; expires_in: number; user: User }

export async function login(email: string, password: string): Promise<User> {
  const data = await api.post<LoginData>('/auth/login', { email, password }, { auth: false })
  tokens.setAccess(data.access_token)
  tokens.markSession()
  return data.user
}

/** 서버에 refresh 무효화(쿠키 삭제)를 요청하고, 결과와 상관없이 이 브라우저의 토큰은 지운다. 이미 로그아웃된 상태(401)면 그대로 성공이다 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 401)) throw e
  } finally {
    tokens.clear()
  }
}

export const fetchMe = () => api.get<User>('/auth/me')

/**
 * 앱 시작 때 refresh 쿠키로 로그인을 되살린다. 되살릴 수 없으면 null.
 * 쿠키는 JS 가 못 읽어 있는지 미리 알 수 없다. 늘 재발급을 시도하고 401 이면 로그인 안 된 것으로 본다.
 * 서버 · 네트워크 일시 오류면 ApiError 를 던진다 (호출자가 다시 시도한다).
 */
export async function restoreSession(): Promise<User | null> {
  const outcome = await refreshAccessToken()
  if (outcome === 'invalid') {
    tokens.clear()
    return null
  }
  if (outcome === 'error') throw new ApiError(0, 'REFRESH_UNAVAILABLE', '로그인 상태를 확인하지 못했습니다.')
  try {
    return await fetchMe()
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null // client 가 이미 세션을 정리했다
    throw e
  }
}
