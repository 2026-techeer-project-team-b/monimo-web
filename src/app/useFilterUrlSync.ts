import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { parseFilters, useFilters, writeFilters } from '@/stores'

/**
 * 공통 상태 ↔ 주소 쿼리 동기화. AppLayout 에서 한 번만 쓴다.
 * - 주소가 바깥에서 바뀌면(처음 열기 · 링크 · 뒤로 가기) 주소에 있는 값으로 상태를 맞춘다.
 * - 상태가 바뀌면 주소를 바꾼다 (기록을 쌓지 않고 replace).
 */
export function useFilterUrlSync() {
  const [params, setParams] = useSearchParams()
  const values = useFilters(useShallow((s) => ({ serviceName: s.serviceName, range: s.range, refreshSec: s.refreshSec })))
  const lastWritten = useRef<string | null>(null)

  useEffect(() => {
    const current = params.toString()
    if (current !== lastWritten.current) {
      const fromUrl = parseFilters(params)
      if (Object.keys(fromUrl).length) useFilters.getState().patch(fromUrl)
    }
    const next = writeFilters(params, useFilters.getState()).toString()
    lastWritten.current = next
    if (next !== current) setParams(new URLSearchParams(next), { replace: true })
  }, [params, setParams, values])
}
