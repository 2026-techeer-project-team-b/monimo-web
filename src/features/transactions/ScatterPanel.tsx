import { useEffect, useMemo, useRef, useState } from 'react'
import type { Agent, Scatter } from '@/api'
import { Badge, Card, Select } from '@/design-system'
import { chartColors, EChart, type ChartInstance, type ChartOption } from '@/shared'
import { filterByResult, toCoordRange, toSelection, type ResultFilter, type Selection } from './selection'

const fmt = (n: number) => n.toLocaleString('en-US')

type Props = {
  scatter: Scatter | undefined
  isError: boolean
  from: string
  to: string
  agents: Agent[]
  agentKey: string
  onAgentKey: (v: string) => void
  result: ResultFilter
  onResult: (v: ResultFilter) => void
  selection: Selection | null
  /** 선택 건수 (격자로 접혀 셀 수 없으면 null) */
  count: { total: number; failed: number } | null
  onSelection: (s: Selection | null) => void
}

type Dot = { value: [number, number]; span: string; status: number | null }

/** 응답시간 분포 카드 — 파드 · 결과 필터, 스캐터, 드래그 선택 */
export function ScatterPanel(p: Props) {
  const { scatter, from, to, result, selection } = p
  // 결과 필터는 화면에서 거른다 (스캐터 API 에는 is_error 파라미터가 없다)
  const points = useMemo(() => filterByResult(scatter?.points ?? [], result), [scatter, result])
  const okCount = points.filter((x) => !x.is_error).length
  const failCount = points.length - okCount

  const option = useMemo<ChartOption>(() => {
    const c = chartColors()
    const dot = (x: (typeof points)[number]): Dot => ({ value: [Date.parse(x.start_time), x.duration_ms], span: x.span_name, status: x.http_status })
    return {
      grid: { left: 52, right: 16, top: 16, bottom: 28 },
      xAxis: { type: 'time', min: Date.parse(from), max: Date.parse(to) },
      // 느린 요청과 빠른 요청을 한 화면에 보려고 세로축은 로그 눈금
      yAxis: { type: 'log', logBase: 10, min: 1, name: 'ms', nameGap: 8 },
      tooltip: { trigger: 'item', formatter: (e: { data: Dot }) => `${e.data.span}<br/>${fmt(e.data.value[1])} ms · ${e.data.status ?? '-'}` },
      brush: {
        xAxisIndex: 0,
        yAxisIndex: 0,
        brushType: 'rect',
        brushMode: 'single',
        transformable: false,
        throttleType: 'debounce',
        throttleDelay: 150,
        brushStyle: { borderWidth: 1.5, color: 'rgba(52, 82, 214, 0.08)', borderColor: c.line.avg },
        outOfBrush: { colorAlpha: 0.35 },
      },
      series: [
        { name: '성공', type: 'scatter', symbolSize: 5, itemStyle: { color: c.scatter.ok }, data: points.filter((x) => !x.is_error).map(dot) },
        { name: '실패', type: 'scatter', symbolSize: 6, itemStyle: { color: c.scatter.fail }, data: points.filter((x) => x.is_error).map(dot) },
      ],
    }
  }, [points, from, to])

  // 드래그 끝 → 선택 조건. 빈 곳을 눌러 사각형이 사라지면 선택 해제
  const onSelectionRef = useRef(p.onSelection)
  useEffect(() => {
    onSelectionRef.current = p.onSelection
  })
  const onEvents = useMemo(
    () => ({
      brushEnd: (e: unknown) => {
        const area = (e as { areas?: { coordRange?: [[number, number], [number, number]] }[] }).areas?.[0]
        onSelectionRef.current(area?.coordRange ? toSelection(area.coordRange) : null)
      },
    }),
    [],
  )

  // 차트를 다시 그리면(자동 새로고침 · 필터) 드래그 모드와 사각형이 풀리므로 매번 되살린다.
  // 차트 인스턴스가 새로 만들어질 때(개발 모드의 두 번 마운트 포함)도 다시 해야 해서 판번호(chartGen)를 둔다
  const chartRef = useRef<ChartInstance | null>(null)
  const [chartGen, setChartGen] = useState(0)
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: 'rect', brushMode: 'single' } })
    chart.dispatchAction({
      type: 'brush',
      areas: selection ? [{ brushType: 'rect', xAxisIndex: 0, yAxisIndex: 0, coordRange: toCoordRange(selection) }] : [],
    })
  }, [option, selection, chartGen])

  return (
    <Card
      className="tx-scatter"
      title={
        <span className="tx-title">
          응답시간 분포
          {scatter ? (
            <Badge tone={scatter.mode === 'bucketed' ? 'warn' : 'accent'} className="text-mono-11">
              mode {scatter.mode} · {fmt(scatter.points.length)}점
            </Badge>
          ) : null}
        </span>
      }
      actions={
        <div className="tx-filters">
          <label className="tx-filter">
            <span className="text-caption-12">파드 agent_key</span>
            <Select value={p.agentKey} onChange={(e) => p.onAgentKey(e.target.value)} aria-label="파드">
              <option value="">전체</option>
              {p.agents.map((a) => (
                <option key={a.agent_uuid} value={a.agent_key}>{a.agent_key}</option>
              ))}
            </Select>
          </label>
          <label className="tx-filter">
            <span className="text-caption-12">결과</span>
            <Select value={result} onChange={(e) => p.onResult(e.target.value as ResultFilter)} aria-label="결과" className="tx-filter__result">
              <option value="all">전체</option>
              <option value="ok">성공</option>
              <option value="fail">실패</option>
            </Select>
          </label>
        </div>
      }
    >
      <div className="tx-scatter__meta text-caption-12">
        <span><i className="tx-dot tx-dot--ok" aria-hidden />성공 {fmt(okCount)}</span>
        <span><i className="tx-dot tx-dot--fail" aria-hidden />실패 {fmt(failCount)}</span>
        {selection ? (
          <span className="tx-scatter__picked">
            {p.count ? `선택 ${fmt(p.count.total)}건 · 실패 ${fmt(p.count.failed)}` : '영역 선택됨 (점이 격자로 접혀 건수는 아래 표에서)'}
            <button type="button" className="tx-linkbtn" onClick={() => p.onSelection(null)}>선택 해제</button>
          </span>
        ) : (
          <span className="tx-scatter__hint">차트를 드래그해 사각형으로 긁으면 그 안의 요청이 아래 표에 나옵니다.</span>
        )}
      </div>
      {scatter?.mode === 'bucketed' ? (
        <p className="tx-note text-caption-12">점이 많아 서버가 격자로 접었습니다(mode bucketed). 범위를 좁히면 요청마다 점이 찍힙니다.</p>
      ) : null}
      {p.isError && !scatter ? (
        <p className="tx-empty text-body-13" role="alert">응답시간 분포를 불러오지 못했습니다.</p>
      ) : !scatter ? (
        <p className="tx-empty text-body-13" role="status">불러오는 중…</p>
      ) : (
        <EChart
          option={option}
          height={320}
          onEvents={onEvents}
          onReady={(c) => {
            chartRef.current = c
            setChartGen((g) => g + 1)
          }}
          aria-label={`응답시간 스캐터: 성공 ${okCount}건, 실패 ${failCount}건. 드래그로 영역을 고르면 요청 목록이 나옵니다.`}
        />
      )}
    </Card>
  )
}
