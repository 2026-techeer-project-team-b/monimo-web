// Figma 06 P5 차트 규약 — 차트 라이브러리를 고르기 전에 색 · 글자 규칙만 먼저 고정한다.
// 값은 CSS 변수 문자열이라 SVG fill/stroke · canvas(getComputedStyle 로 풀어서) 어디든 넣을 수 있다.
//   - 세로축은 항상 0 에서 시작하고 시간 축은 왼쪽이 과거다
//   - 점 · 셀 · 선 외의 장식은 넣지 않는다

const mix = (token: string, pct: number) => `color-mix(in srgb, var(${token}) ${pct}%, transparent)`

export const chartTheme = {
  /** 축 글자: Mono/11 · text/tertiary */
  axisTextClass: 'text-mono-11',
  axisText: 'var(--color-text-tertiary)',
  /** 격자선: border/grid 1px */
  grid: 'var(--color-border-grid)',
  gridWidth: 1,

  /** 스캐터: 성공 점 accent 60% 투명 · 실패 점 status/crit (점 5px) */
  scatter: { ok: mix('--color-accent-default', 60), fail: 'var(--color-status-crit)', size: 5 },

  /** 히트맵: accent 5단계 농도 (L1 → L5) · 에러가 있는 셀은 status/crit 90% */
  heatmap: {
    levels: [7, 18, 34, 55, 82].map((p) => mix('--color-accent-default', p)),
    error: mix('--color-status-crit', 90),
  },

  /** 라인: avg 는 accent 실선 2px, min–max 는 accent 10% 밴드 */
  line: { avg: 'var(--color-accent-default)', avgWidth: 2, band: mix('--color-accent-default', 10) },
} as const

/** 히트맵 농도 단계. 0 이하 → null(빈 셀), 최대값 대비 비율로 L1~L5 */
export function heatmapLevel(value: number, max: number): string | null {
  if (value <= 0 || max <= 0) return null
  const i = Math.min(4, Math.floor((value / max) * 5))
  return chartTheme.heatmap.levels[i]
}

/**
 * 서비스 색 — service/1~6 을 위에서부터 순서대로 배정한다. 한 화면 안에서는 같은 서비스에 같은 색을 유지하도록
 * 서비스 이름 목록(정렬된 순서)을 한 번 만들어 이 함수에 index 를 넘긴다. 7번째부터는 다시 1번 색.
 */
export function serviceColor(index: number): string {
  return `var(--color-service-${(((index % 6) + 6) % 6) + 1})`
}
