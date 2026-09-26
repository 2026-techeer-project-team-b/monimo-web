// 06 P5 차트 규약을 ECharts 테마와 색 값으로 옮긴다.
//   축 글자 Mono/11 · text/tertiary, 격자선 border/grid 1px, 세로축은 0 부터, 서비스 색은 service/1~6 순서.
import { chartTheme } from '@/design-system'
import { echarts } from './echarts'
import { readToken, resolveColor } from './resolveColor'

export const THEME_NAME = 'monimo'

/** 캔버스에 바로 넣을 수 있게 풀어 둔 규약 색 */
export type ChartColors = {
  axisText: string
  grid: string
  text: string
  surface: string
  border: string
  scatter: { ok: string; fail: string }
  heatmap: { levels: string[]; error: string }
  line: { avg: string; band: string }
  service: string[]
}

let colors: ChartColors | null = null

/** 규약 색 (처음 한 번 계산해 둔다) */
export function chartColors(): ChartColors {
  colors ??= {
    axisText: resolveColor(chartTheme.axisText),
    grid: resolveColor(chartTheme.grid),
    text: resolveColor('var(--color-text-primary)'),
    surface: resolveColor('var(--color-bg-surface)'),
    border: resolveColor('var(--color-border-default)'),
    scatter: { ok: resolveColor(chartTheme.scatter.ok), fail: resolveColor(chartTheme.scatter.fail) },
    heatmap: { levels: chartTheme.heatmap.levels.map(resolveColor), error: resolveColor(chartTheme.heatmap.error) },
    line: { avg: resolveColor(chartTheme.line.avg), band: resolveColor(chartTheme.line.band) },
    service: [1, 2, 3, 4, 5, 6].map((i) => resolveColor(`var(--color-service-${i})`)),
  }
  return colors
}

/**
 * 06 P5 히트맵 색 규칙을 ECharts visualMap 으로. 셀 값 [x, y, 건수, 단계] 의 4번째(단계)로 칠한다.
 * 단계: 0 = 빈 칸, 1~5 = accent 농도, 6 = 에러 셀. 단계 계산은 heatmapStep() 으로.
 */
export function heatmapVisualMap() {
  const c = chartColors()
  return {
    type: 'piecewise' as const,
    show: false,
    dimension: 3,
    pieces: [
      { value: 0, color: 'rgba(0, 0, 0, 0)' },
      ...c.heatmap.levels.map((color, i) => ({ value: i + 1, color })),
      { value: 6, color: c.heatmap.error },
    ],
  }
}

/** 건수 → 히트맵 단계 (0 = 빈 칸, 1~5 = 최대값 대비 농도, 에러 셀이면 6) */
export function heatmapStep(count: number, max: number, hasError = false): number {
  if (hasError) return 6
  if (count <= 0 || max <= 0) return 0
  return Math.min(5, Math.floor((count / max) * 5) + 1)
}

let registered = false

/** ECharts 테마를 한 번 등록한다 (EChart 가 처음 그려질 때) */
export function ensureTheme(): string {
  if (registered) return THEME_NAME
  const c = chartColors()
  const sans = readToken('--font-sans') || 'sans-serif'
  const mono = readToken('--font-mono') || 'monospace'
  const axis = {
    axisLine: { lineStyle: { color: c.grid } },
    axisTick: { show: false },
    axisLabel: { color: c.axisText, fontFamily: mono, fontSize: 11, hideOverlap: true }, // 좁은 차트에서 글자가 겹치면 숨긴다
    splitLine: { lineStyle: { color: c.grid, width: chartTheme.gridWidth } },
    nameTextStyle: { color: c.axisText, fontFamily: sans, fontSize: 11 },
  }
  echarts.registerTheme(THEME_NAME, {
    color: c.service,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: sans, color: c.text },
    categoryAxis: axis,
    valueAxis: { ...axis, scale: false }, // 세로축은 0 에서 시작
    // 시간 축은 브라우저 시간 기준 14:05 형식. 날짜가 바뀌는 눈금만 09-24 처럼 날짜로
    timeAxis: {
      ...axis,
      axisLabel: {
        ...axis.axisLabel,
        formatter: { year: '{yyyy}', month: '{MM}-{dd}', day: '{MM}-{dd}', hour: '{HH}:{mm}', minute: '{HH}:{mm}', second: '{HH}:{mm}:{ss}', millisecond: '{HH}:{mm}:{ss}' },
      },
    },
    logAxis: axis,
    grid: { left: 48, right: 16, top: 16, bottom: 32, containLabel: false },
    tooltip: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: c.text, fontFamily: sans, fontSize: 12 },
      // ECharts 툴팁 기본 z-index(9999999)는 드로어 · 모달 위로 뜬다. 드로어(--layer-drawer 100) 바로 아래로 내린다
      extraCssText: 'box-shadow: var(--shadow-overlay); border-radius: var(--radius-sm); z-index: calc(var(--layer-drawer) - 1);',
    },
    legend: { textStyle: { color: c.axisText, fontFamily: sans, fontSize: 12 } },
  })
  registered = true
  return THEME_NAME
}
