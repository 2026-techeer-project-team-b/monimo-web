import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { filterKeyString, parseFilters, useFilters, writeFilters } from '@/stores'

/**
 * 공통 상태 ↔ 주소 쿼리 동기화. AppLayout 에서 한 번만 쓴다.
 * - 주소의 공통 상태 키(service · range · from · to · refresh)가 바깥에서 바뀌면(처음 열기 · 링크 · 뒤로 가기) 그 값으로 상태를 맞춘다.
 *   화면이 자기 쿼리(tab 등)만 바꾼 경우는 바깥 변경으로 보지 않는다.
 * - 상태가 바뀌면 주소를 바꾼다 (기록을 쌓지 않고 replace).
 */
export function useFilterUrlSync() {
  const [params, setParams] = useSearchParams()
  const values = useFilters(useShallow((s) => ({ serviceName: s.serviceName, range: s.range, refreshSec: s.refreshSec })))
  /** 마지막으로 우리가 주소에 쓴 공통 상태 키 */
  const lastWritten = useRef<string | null>(null)

  useEffect(() => {
    if (filterKeyString(params) !== lastWritten.current) {
      const fromUrl = parseFilters(params)
      if (Object.keys(fromUrl).length) useFilters.getState().patch(fromUrl)
    }
    const next = writeFilters(params, useFilters.getState())
    lastWritten.current = filterKeyString(next)
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [params, setParams, values])
}
