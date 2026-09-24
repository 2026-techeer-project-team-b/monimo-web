import { createContext, useContext } from 'react'
import type { User } from '@/api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthValue = {
  status: AuthStatus
  user: User | null
  isAdmin: boolean
  /** 재발급까지 실패해 로그아웃된 경우 true. 로그인 화면이 "세션 만료" 배너를 띄운다 */
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

/** 로그인 상태 · 사용자 · 역할. AuthProvider 안에서만 쓴다 */
export function useAuth(): AuthValue {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth 는 AuthProvider 안에서만 쓸 수 있습니다')
  return v
}
