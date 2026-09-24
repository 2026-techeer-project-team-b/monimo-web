import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { login as apiLogin, logout as apiLogout, onSessionExpired, restoreSession, type User } from '@/api'
import { REFRESH_KEY, tokens } from '@/api/tokens'
import { AuthContext, type AuthStatus, type AuthValue } from './context'

/** 서버 · 네트워크 일시 오류일 때 세션 복원을 다시 시도하는 간격 (ms). 다 실패하면 로그인 화면 (토큰은 남는다) */
const RESTORE_RETRY_MS = [1000, 3000]

/**
 * 로그인 상태를 앱 전체에 준다.
 * - 시작할 때 저장된 refresh 로 세션을 되살린다 (일시 오류면 잠시 뒤 다시 시도).
 * - API 가 재발급까지 실패하면 익명으로 바꾼다 → 라우트 가드가 로그인 화면으로 보낸다.
 * - 다른 탭에서 로그인 · 로그아웃하면 이 탭도 따라간다 (다른 사람 토큰으로 요청하면서 이전 사람 화면을 보이지 않도록).
 * - 사용자가 바뀌는 모든 순간(로그인 · 로그아웃 · 만료 · 탭 동기화)에 서버 데이터 캐시를 비운다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const restore = (attempt = 0) => {
      restoreSession()
        .then((u) => {
          if (!alive) return
          setUser(u)
          setStatus(u ? 'authenticated' : 'anonymous')
        })
        .catch(() => {
          if (!alive) return
          if (attempt < RESTORE_RETRY_MS.length) timer = setTimeout(() => restore(attempt + 1), RESTORE_RETRY_MS[attempt])
          else setStatus('anonymous')
        })
    }
    restore()

    const offExpired = onSessionExpired(() => {
      setUser(null)
      setStatus('anonymous')
      setSessionExpired(true)
      queryClient.clear()
    })

    const onStorage = (e: StorageEvent) => {
      if (e.key !== REFRESH_KEY && e.key !== null) return
      tokens.dropAccess()
      queryClient.clear()
      setUser(null)
      setSessionExpired(false)
      if (e.newValue) {
        setStatus('loading') // 다른 탭이 로그인했다 → 그 계정으로 다시 복원
        restore()
      } else {
        setStatus('anonymous') // 다른 탭이 로그아웃했다
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      alive = false
      clearTimeout(timer)
      offExpired()
      window.removeEventListener('storage', onStorage)
    }
  }, [queryClient])

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await apiLogin(email, password)
      queryClient.clear()
      setUser(u)
      setStatus('authenticated')
      setSessionExpired(false)
    },
    [queryClient],
  )

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
