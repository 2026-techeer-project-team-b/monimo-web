// 상단바 공통 상태: 서비스 · 시간 범위 · 자동 새로고침 주기.
// 거의 모든 화면이 같이 쓰므로 한 곳에 둔다. 주소(URL)와의 동기화는 app/useFilterUrlSync 가 맡는다.
import { useMemo } from 'react'
import { create } from 'zustand'

export const RANGE_PRESETS = ['5m', '15m', '1h', '6h', '24h'] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

const PRESET_MS: Record<RangePreset, number> = {
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '6h': 6 * 60 * 60_000,
  '24h': 24 * 60 * 60_000,
}

/** 프리셋(지금부터 거슬러 올라가는 상대 범위) 또는 사용자 지정(고정 시각, UTC ISO) */
export type TimeRange = { kind: 'preset'; preset: RangePreset } | { kind: 'custom'; from: string; to: string }

/** 자동 새로고침 주기(초). 0 = 끔 */
export const REFRESH_OPTIONS = [0, 10, 30, 60, 300] as const
export type RefreshSec = (typeof REFRESH_OPTIONS)[number]

export type FilterValues = {
  /** 선택한 서비스 이름(applications.name = 명세의 service_name). null = 전체 */
  serviceName: string | null
  range: TimeRange
  refreshSec: RefreshSec
}

type FilterState = FilterValues & {
  /** 상대 범위의 기준 시각(ms). 새로고침할 때마다 지금으로 바뀌고, 그러면 시간 창이 다시 계산된다 */
  anchor: number
  setServiceName: (name: string | null) => void
  setRange: (range: TimeRange) => void
  setRefreshSec: (sec: RefreshSec) => void
  /** 시간 창을 지금 기준으로 다시 계산한다 (자동 새로고침 · 새로고침 버튼) */
  refreshNow: () => void
  /** 주소에서 읽은 값을 한 번에 반영 */
  patch: (values: Partial<FilterValues>) => void
}

export const DEFAULT_FILTERS: FilterValues = { serviceName: null, range: { kind: 'preset', preset: '1h' }, refreshSec: 30 }

export const useFilters = create<FilterState>()((set) => ({
  ...DEFAULT_FILTERS,
  anchor: Date.now(),
  setServiceName: (serviceName) => set({ serviceName }),
  setRange: (range) => set({ range, anchor: Date.now() }),
  setRefreshSec: (refreshSec) => set({ refreshSec }),
  refreshNow: () => set({ anchor: Date.now() }),
  // 범위가 실제로 바뀐 경우에만 기준 시각을 다시 잡는다 (같은 값이 다시 들어와도 시간 창이 흔들리지 않게)
  patch: (values) => set((s) => ({ ...values, anchor: values.range && !sameRange(values.range, s.range) ? Date.now() : s.anchor })),
}))

export function sameRange(a: TimeRange, b: TimeRange): boolean {
  if (a.kind === 'preset' || b.kind === 'preset') return a.kind === b.kind && a.kind === 'preset' && b.kind === 'preset' && a.preset === b.preset
  return a.from === b.from && a.to === b.to
}

/** 명세 형식: UTC ISO, 초 단위 (예: 2026-09-14T10:20:30Z) */
export const toIso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')

/** 명세 공통 파라미터 from(포함) · to(제외), UTC ISO 초 단위 */
export type TimeWindow = { from: string; to: string }

export function timeWindowOf(range: TimeRange, anchor: number): TimeWindow {
  if (range.kind === 'custom') return { from: range.from, to: range.to }
  const to = Math.floor(anchor / 1000) * 1000
  return { from: toIso(to - PRESET_MS[range.preset]), to: toIso(to) }
}

/** 화면용: 선택한 서비스 이름. null = 전체 */
export const useServiceName = () => useFilters((s) => s.serviceName)

/**
 * 화면용: 지금 조회할 시간 창. 자동 새로고침 때마다 값이 바뀌므로 TanStack Query 의 queryKey 에 넣는다.
 *   const { from, to } = useTimeWindow()
 *   useQuery({ queryKey: ['server-map', serviceName, from, to], queryFn: () => api.get('/server-map', { query: { service_name, from, to } }), placeholderData: keepPreviousData })
 */
export function useTimeWindow(): TimeWindow {
  const range = useFilters((s) => s.range)
  const anchor = useFilters((s) => s.anchor)
  return useMemo(() => timeWindowOf(range, anchor), [range, anchor])
}
