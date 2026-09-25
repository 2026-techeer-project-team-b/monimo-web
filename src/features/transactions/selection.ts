// 스캐터 드래그 선택 — ECharts brush 의 사각형 ↔ 요청 목록 조건. React 와 무관한 계산만 둔다
import type { ScatterPoint } from '@/api'
import { toIso } from '@/stores'

/** 드래그한 사각형. 시각은 [from, to), 응답시간은 [min, max] (ms, 정수) */
export type Selection = { from: string; to: string; minMs: number; maxMs: number }

/** 결과 필터: 전체 · 성공만 · 실패만 */
export type ResultFilter = 'all' | 'ok' | 'fail'

export const isErrorOf = (r: ResultFilter): boolean | undefined => (r === 'all' ? undefined : r === 'fail')

/**
 * brush 의 coordRange([[x0, x1], [y0, y1]], 데이터 좌표) → 선택 조건.
 * 명세의 시각은 초 단위라 시작은 내림 · 끝은 올림, 응답시간도 정수로 내림 · 올림해 사각형 안의 점이 빠지지 않게 한다
 */
export function toSelection(range: [[number, number], [number, number]]): Selection {
  const [[x0, x1], [y0, y1]] = range
  return {
    from: toIso(Math.floor(Math.min(x0, x1) / 1000) * 1000),
    to: toIso(Math.ceil(Math.max(x0, x1) / 1000) * 1000),
    minMs: Math.max(0, Math.floor(Math.min(y0, y1))),
    maxMs: Math.ceil(Math.max(y0, y1)),
  }
}

/** 선택 조건 → brush 에 다시 그릴 사각형 (자동 새로고침으로 차트를 다시 그린 뒤 복원용) */
export function toCoordRange(s: Selection): [[number, number], [number, number]] {
  return [
    [Date.parse(s.from), Date.parse(s.to)],
    [Math.max(1, s.minMs), s.maxMs],
  ]
}

/** 스캐터 점 가운데 사각형 안에 드는 것 (목록 API 와 같은 조건) */
export function pointsIn(points: ScatterPoint[], s: Selection): ScatterPoint[] {
  const from = Date.parse(s.from)
  const to = Date.parse(s.to)
  return points.filter((p) => {
    const t = Date.parse(p.start_time)
    return t >= from && t < to && p.duration_ms >= s.minMs && p.duration_ms <= s.maxMs
  })
}

/** 결과 필터를 적용한 스캐터 점 */
export const filterByResult = (points: ScatterPoint[], r: ResultFilter) =>
  r === 'all' ? points : points.filter((x) => x.is_error === (r === 'fail'))

/**
 * 사각형 안의 건수 · 실패 건수. 점이 요청 하나씩일 때(mode raw)만 정확하므로, 격자로 접혔으면(bucketed) null
 */
export function selectedCount(scatter: { mode: string; points: ScatterPoint[] } | undefined, s: Selection | null, r: ResultFilter) {
  if (!s || scatter?.mode !== 'raw') return null
  const picked = pointsIn(filterByResult(scatter.points, r), s)
  return { total: picked.length, failed: picked.filter((x) => x.is_error).length }
}
