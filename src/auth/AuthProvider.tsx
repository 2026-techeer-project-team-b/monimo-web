import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { login as apiLogin, logout as apiLogout, onSessionExpired, restoreSession, type User } from '@/api'
import { AuthContext, type AuthStatus, type AuthValue } from './context'

/**
 * 로그인 상태를 앱 전체에 준다.
 * 시작할 때 저장된 refresh 로 세션을 되살리고, API 가 재발급까지 실패하면 익명으로 바꾼다(라우트 가드가 로그인 화면으로 보낸다).
 * 로그아웃 · 세션 만료 때는 이전 사용자의 서버 데이터 캐시를 비운다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let alive = true
    restoreSession()
      .then((u) => {
        if (!alive) return
        setUser(u)
        setStatus(u ? 'authenticated' : 'anonymous')
      })
      .catch(() => alive && setStatus('anonymous'))
    const off = onSessionExpired(() => {
      setUser(null)
      setStatus('anonymous')
      setSessionExpired(true)
      queryClient.clear()
    })
    return () => {
      alive = false
      off()
    }
  }, [queryClient])

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password)
    setUser(u)
    setStatus('authenticated')
    setSessionExpired(false)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setStatus('anonymous')
      setSessionExpired(false)
      queryClient.clear()
    }
  }, [queryClient])

  const value = useMemo<AuthValue>(
    () => ({ status, user, isAdmin: user?.role === 'ADMIN', sessionExpired, login, logout }),
    [status, user, sessionExpired, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
