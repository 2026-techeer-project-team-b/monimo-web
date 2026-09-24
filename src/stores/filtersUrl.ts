// 공통 상태 ↔ 주소 쿼리.  ?service=shop-order&range=1h&refresh=30   사용자 지정은 range=custom&from=…&to=…
// 화면이 쓰는 다른 쿼리(tab 등)는 건드리지 않는다.
import { RANGE_PRESETS, REFRESH_OPTIONS, toIso, type FilterValues, type RangePreset, type RefreshSec } from './filters'

export const FILTER_KEYS = ['service', 'range', 'from', 'to', 'refresh'] as const

const isIso = (v: string | null): v is string => !!v && !Number.isNaN(Date.parse(v))

/** 공통 상태 키만 뽑은 비교용 문자열 (화면의 다른 쿼리는 빼고) */
export function filterKeyString(params: URLSearchParams): string {
  return FILTER_KEYS.map((k) => `${k}=${params.get(k) ?? ''}`).join('&')
}

/**
 * 주소에 있는 값만 돌려준다 (없거나 잘못된 값은 빼서, 지금 상태를 유지하게).
 * 주의: "전체" 서비스는 service 키가 없는 것으로 적으므로, 서비스 키 없는 링크를 열면 지금 고른 서비스가 유지된다.
 * 사용자 지정 시각은 명세 형식(UTC ISO 초 단위)으로 다시 맞춘다.
 */
export function parseFilters(params: URLSearchParams): Partial<FilterValues> {
  const out: Partial<FilterValues> = {}
  if (params.has('service')) out.serviceName = params.get('service') || null
  const range = params.get('range')
  if (range && (RANGE_PRESETS as readonly string[]).includes(range)) out.range = { kind: 'preset', preset: range as RangePreset }
  else if (range === 'custom') {
    const from = params.get('from')
    const to = params.get('to')
    if (isIso(from) && isIso(to) && Date.parse(from) < Date.parse(to)) out.range = { kind: 'custom', from: toIso(Date.parse(from)), to: toIso(Date.parse(to)) }
  }
  const refresh = Number(params.get('refresh'))
  if (params.has('refresh') && (REFRESH_OPTIONS as readonly number[]).includes(refresh)) out.refreshSec = refresh as RefreshSec
  return out
}

/** 기존 쿼리에 공통 상태를 덮어쓴 새 쿼리 */
export function writeFilters(params: URLSearchParams, values: FilterValues): URLSearchParams {
  const next = new URLSearchParams(params)
  FILTER_KEYS.forEach((k) => next.delete(k))
  if (values.serviceName) next.set('service', values.serviceName)
  if (values.range.kind === 'preset') next.set('range', values.range.preset)
  else {
    next.set('range', 'custom')
    next.set('from', values.range.from)
    next.set('to', values.range.to)
  }
  next.set('refresh', String(values.refreshSec))
  return next
}
