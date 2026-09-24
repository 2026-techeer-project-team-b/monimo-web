// 인증 문 4개 (api-spec 20 · 28 · 31 · 32번)
import { api, refreshAccessToken } from './client'
import { tokens } from './tokens'

export type Role = 'ADMIN' | 'VIEWER'

export type User = {
  user_uuid: string
  email: string
  name: string
  role: Role
  created_at?: string
}

type LoginData = { access_token: string; refresh_token: string; expires_in: number; user: User }

export async function login(email: string, password: string): Promise<User> {
  const data = await api.post<LoginData>('/auth/login', { email, password }, { auth: false })
  tokens.setAccess(data.access_token)
  tokens.setRefresh(data.refresh_token)
  return data.user
}

/** 서버에 refresh 무효화를 요청하고, 결과와 상관없이 이 브라우저의 토큰은 지운다 */
export async function logout(): Promise<void> {
  const refreshToken = tokens.getRefresh()
  try {
    if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken })
  } finally {
    tokens.clear()
  }
}

export const fetchMe = () => api.get<User>('/auth/me')

/** 앱 시작 때 저장된 refresh 로 로그인을 되살린다. 되살릴 수 없으면 null */
export async function restoreSession(): Promise<User | null> {
  if (!tokens.getRefresh()) return null
  const outcome = await refreshAccessToken()
  if (outcome === 'invalid') {
    tokens.clear()
    return null
  }
  if (outcome === 'error') return null // 서버 문제면 토큰은 남겨 두고 로그인 화면만 보여준다
  return fetchMe()
}
