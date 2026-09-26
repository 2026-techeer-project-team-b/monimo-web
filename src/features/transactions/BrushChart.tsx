import { useEffect, useMemo, useRef, useState } from 'react'
import { EChart, type ChartInstance, type ChartOption } from '@/shared'

export type BrushRange = [[number, number], [number, number]]

type Props = {
  /** 차트 option. brush 설정은 여기서 덧붙인다 (useMemo 로 감싸서 넘긴다) */
  option: ChartOption
  /** 지금 선택(데이터 좌표). 차트를 다시 그려도 이 사각형을 되살린다 */
  range: BrushRange | null
  /** 드래그가 끝나면 사각형(데이터 좌표), 사각형이 사라지면 null */
  onRange: (range: BrushRange | null) => void
  /** 사각형 테두리 색 (캔버스용으로 풀린 값) */
  color: string
  height: number
  'aria-label': string
}

/**
 * 드래그로 사각형을 긁어 고르는 차트 (스캐터 · 히트맵 공용). ECharts brush 를 늘 켜 두고,
 * 차트를 다시 그릴 때(새로고침 · 필터 · 차트 인스턴스 재생성) 드래그 모드와 사각형을 되살린다
 */
export function BrushChart({ option, range, onRange, color, height, 'aria-label': ariaLabel }: Props) {
  const withBrush = useMemo<ChartOption>(
    () => ({
      ...option,
      brush: {
        xAxisIndex: 0,
        yAxisIndex: 0,
        brushType: 'rect',
        brushMode: 'single',
        transformable: false,
        throttleType: 'debounce',
        throttleDelay: 150,
        brushStyle: { borderWidth: 1.5, color: 'rgba(52, 82, 214, 0.08)', borderColor: color },
        outOfBrush: { colorAlpha: 0.35 },
      },
    }),
    [option, color],
  )

  const onRangeRef = useRef(onRange)
  useEffect(() => {
    onRangeRef.current = onRange
  })
  const onEvents = useMemo(
    () => ({
      brushEnd: (e: unknown) => {
        const area = (e as { areas?: { coordRange?: BrushRange }[] }).areas?.[0]
        onRangeRef.current(area?.coordRange ?? null)
      },
    }),
    [],
  )

  // 차트 인스턴스가 새로 만들어질 때(개발 모드의 두 번 마운트 포함)도 다시 켜야 해서 판번호(chartGen)를 둔다
  const chartRef = useRef<ChartInstance | null>(null)
  const [chartGen, setChartGen] = useState(0)
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: 'rect', brushMode: 'single' } })
    chart.dispatchAction({ type: 'brush', areas: range ? [{ brushType: 'rect', xAxisIndex: 0, yAxisIndex: 0, coordRange: range }] : [] })
  }, [withBrush, range, chartGen])

  return (
    <EChart
      option={withBrush}
      height={height}
      onEvents={onEvents}
      onReady={(c) => {
        chartRef.current = c
        setChartGen((g) => g + 1)
      }}
      aria-label={ariaLabel}
    />
  )
}
