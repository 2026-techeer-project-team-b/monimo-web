import { useSearchParams } from 'react-router'

/**
 * 표 필터 (주소 쿼리에 둔다 — 새로고침 · 링크 공유해도 유지).
 * at 은 막대를 눌러 고른 칸의 시작 시각(ms 글자) — 표를 그 칸 시간으로 좁힌다
 */
export type ErrorFilters = { agentKey: string; httpStatus: string; exceptionType: string; at: string }

const KEYS = { agentKey: 'agent', httpStatus: 'status', exceptionType: 'exception', at: 'at' } as const

export function useErrorFilters() {
  const [params, setParams] = useSearchParams()
  const filters: ErrorFilters = {
    agentKey: params.get(KEYS.agentKey) ?? '',
    httpStatus: params.get(KEYS.httpStatus) ?? '',
    exceptionType: params.get(KEYS.exceptionType) ?? '',
    at: params.get(KEYS.at) ?? '',
  }
  // 기록은 남기지 않는다(replace) — 뒤로가기가 필터를 하나씩 되돌리지 않게
  const setFilters = (next: Partial<ErrorFilters>) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(next) as [keyof ErrorFilters, string][]) {
          if (v) p.set(KEYS[k], v)
          else p.delete(KEYS[k])
        }
        return p
      },
      { replace: true },
    )
  return { filters, setFilters }
}
