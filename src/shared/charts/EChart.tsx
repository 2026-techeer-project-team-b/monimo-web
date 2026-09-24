import { useEffect, useRef, type CSSProperties } from 'react'
import { echarts, type ChartInstance, type ChartOption } from './echarts'
import { ensureTheme } from './theme'
import './EChart.css'

export type EChartProps = {
  /** ECharts option. 색은 chartColors() 의 풀린 값을 쓴다. 참조가 바뀔 때마다 통째로 다시 그리므로 useMemo 로 감싸서 넘긴다 */
  option: ChartOption
  /** 차트가 무엇을 보여주는지 (스크린리더용, 필수) */
  'aria-label': string
  /** 높이. 기본 240px. 폭은 부모를 채운다 */
  height?: number | string
  /** 이벤트 이름 → 처리기. 예: { brushSelected: (e) => …, click: (e) => … }. 참조가 바뀌면 다시 연결하므로 useMemo 로 감싸서 넘긴다 */
  onEvents?: Record<string, (params: unknown) => void>
  /** 인스턴스가 준비되면 한 번 불린다 (브러시 켜기 등 명령형 조작용) */
  onReady?: (chart: ChartInstance) => void
  className?: string
  style?: CSSProperties
}

/**
 * 모든 차트가 거쳐 가는 공용 틀. 06 P5 테마를 입히고, 부모 크기가 바뀌면 다시 그리고, 사라지면 정리한다.
 * option 이 바뀌면 통째로 교체한다(notMerge) — 이전 데이터가 섞여 남지 않게.
 * option 이 잘못돼 그리지 못하면 그 차트 자리에만 안내를 띄운다 (화면 전체가 멈추지 않게).
 */
export function EChart({ option, height = 240, onEvents, onReady, className, style, ...rest }: EChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ChartInstance | null>(null)
  // 그리기 실패 안내. 차트 라이브러리(외부)와 맞추는 일이라 React 상태 대신 DOM 표시로 켜고 끈다
  const failRef = useRef<HTMLDivElement>(null)
  const showFail = (fail: boolean) => {
    if (failRef.current) failRef.current.hidden = !fail
  }
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  })

  // 만들기 · 크기 따라가기 · 정리
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const chart = echarts.init(el, ensureTheme(), { renderer: 'canvas' })
    chartRef.current = chart
    onReadyRef.current?.(chart)
    const ro = new ResizeObserver(() => {
      try {
        chart.resize()
      } catch (e) {
        console.error('[EChart] 크기를 바꿔 다시 그리지 못했습니다', e)
        showFail(true)
      }
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    try {
      chartRef.current?.setOption(option, { notMerge: true })
      showFail(false)
    } catch (e) {
      console.error('[EChart] 차트를 그리지 못했습니다', e)
      showFail(true)
    }
  }, [option])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !onEvents) return
    const entries = Object.entries(onEvents)
    entries.forEach(([name, fn]) => chart.on(name, fn))
    return () => entries.forEach(([name, fn]) => chart.off(name, fn))
  }, [onEvents])

  return (
    <div style={{ position: 'relative', width: '100%', height, ...style }} className={className}>
      <div ref={ref} role="img" aria-label={rest['aria-label']} style={{ width: '100%', height: '100%' }} />
      <div ref={failRef} hidden role="alert" className="echart__fail text-caption-12">
        차트를 그리지 못했습니다
      </div>
    </div>
  )
}
