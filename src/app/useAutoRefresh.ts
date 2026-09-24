import { useEffect } from 'react'
import { useFilters } from '@/stores'

/**
 * 새로고침 주기마다 시간 창을 지금 기준으로 다시 계산한다 → 시간 창을 queryKey 에 넣은 쿼리가 새로 불린다.
 * 탭이 숨겨지면 멈추고, 다시 보이면 바로 한 번 갱신한다. 사용자 지정(고정 시각) 범위에서는 돌지 않는다.
 */
export function useAutoRefresh() {
  const refreshSec = useFilters((s) => s.refreshSec)
  const live = useFilters((s) => s.range.kind === 'preset')

  useEffect(() => {
    if (!refreshSec || !live) return
    let timer: ReturnType<typeof setInterval> | undefined
    const start = () => {
      clearInterval(timer)
      timer = setInterval(() => useFilters.getState().refreshNow(), refreshSec * 1000)
    }
    const onVisibility = () => {
      if (document.hidden) clearInterval(timer)
      else {
        useFilters.getState().refreshNow()
        start()
      }
    }
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshSec, live])
}
