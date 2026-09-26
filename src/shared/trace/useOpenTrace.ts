import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

/** 트레이스 드로어를 여는 주소 쿼리 이름. `?trace=<trace_id>` 가 있으면 어느 화면에서든 드로어가 열린다 */
export const TRACE_PARAM = 'trace'

/**
 * 트레이스 상세 드로어 열기 · 닫기.
 * 둘 다 주소를 replace 로 바꿔 방문 기록을 남기지 않는다 — 드로어를 여닫고 뒤로가기를 눌러도 필터가 되돌아가지 않고 이전 페이지로 간다.
 * 다른 쿼리(서비스 · 시간 범위 · 탭)는 그대로 둔다
 *   const { open } = useOpenTrace()
 *   <TableRow onClick={() => open(row.trace_id)}>
 */
export function useOpenTrace() {
  const [, setParams] = useSearchParams()
  // react-router 의 setParams 는 주소가 바뀔 때마다 새 함수가 된다. ref 로 받아 open · close 를 늘 같은 함수로 유지한다
  // (차트 onEvents 처럼 참조가 바뀌면 다시 연결하는 곳이 필터를 바꿀 때마다 다시 붙지 않게)
  const setRef = useRef(setParams)
  useEffect(() => {
    setRef.current = setParams
  })
  const set = useCallback(
    (traceId: string | null) =>
      setRef.current(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (traceId) next.set(TRACE_PARAM, traceId)
          else next.delete(TRACE_PARAM)
          return next
        },
        { replace: true },
      ),
    [],
  )
  const open = useCallback((traceId: string) => set(traceId), [set])
  const close = useCallback(() => set(null), [set])
  return { open, close }
}

/** 지금 열린 트레이스 id (없으면 null) — 목록에서 열린 행을 표시할 때 */
export function useOpenTraceId(): string | null {
  const [params] = useSearchParams()
  return params.get(TRACE_PARAM)
}
