import { useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getMetricSeries } from '@/api'
import { Badge, Card, formatTime, IconClose } from '@/design-system'
import { chartColors, EChart, resolveColor, type ChartOption } from '@/shared'
import { currentOf, fmtMetric, toView, type MetricUi, type ViewLine } from './metricView'

type Props = {
  ui: MetricUi
  serviceName: string
  agentKey: string
  from: string
  to: string
  /** 있으면 제목 옆에 빼기 버튼 (지표 추가로 붙인 차트) */
  onRemove?: () => void
}

/** 지표 한 장 — GET /metrics/series 를 그 파드로 좁혀 그리고, 오른쪽에 현재값 · 범례 */
export function MetricChartCard({ ui, serviceName, agentKey, from, to, onRemove }: Props) {
  const q = useQuery({
    queryKey: ['metric-series', serviceName, agentKey, ui.metric, from, to],
    queryFn: ({ signal }) => getMetricSeries({ serviceName, agentKey, metricName: ui.metric, from, to }, signal),
    placeholderData: keepPreviousData,
  })
  // 파드를 바꾼 직후 이전 파드의 값이 잠깐 남아 보이지 않게, 같은 파드 응답일 때만 쓴다
  const data = q.data && q.data.series.every((s) => s.agent_key === agentKey) ? q.data : undefined
  const lines = useMemo(() => (data ? toView(data, ui) : []), [data, ui])
  const option = useMemo(() => (lines.length ? optionOf(lines, ui, Date.parse(from), Date.parse(to)) : null), [lines, ui, from, to])
  const current = currentOf(lines)
  const over = ui.limit !== undefined && current !== null && current > ui.limit
  // 마지막 점이 시간 창 끝보다 두 칸 넘게 앞이면(끊긴 파드) "현재" 가 아니라 그 시각의 값이다
  const lastT = lines[0]?.points.at(-1)?.t
  const stale = data && lastT !== undefined && Date.parse(to) - lastT > 2 * data.step * 1000 + 60_000

  return (
    <Card className="in-chart">
      <header className="in-chart__head">
        <h3 className="text-section-15">{ui.title}</h3>
        {ui.title !== ui.metric ? <span className="text-mono-11 in-muted">{ui.metric}</span> : null}
        {data ? (
          <Badge tone="accent" className="text-mono-11 in-chart__source" title={`step ${data.step}s`}>
            {data.source_table}
          </Badge>
        ) : null}
        {onRemove ? (
          <button type="button" className="in-remove" aria-label={`${ui.metric} 차트 빼기`} title="차트 빼기" onClick={onRemove}>
            <IconClose size={14} />
          </button>
        ) : null}
      </header>
      {q.isError && !q.data ? (
        <p className="in-empty text-body-13" role="alert">지표를 불러오지 못했습니다.</p>
      ) : !q.data || !data ? (
        <p className="in-empty text-body-13" role="status">불러오는 중…</p>
      ) : !option ? (
        <p className="in-empty text-body-13" role="status">이 시간 범위에 이 파드의 신호가 없습니다.</p>
      ) : (
        <div className="in-chart__body">
          <EChart
            option={option}
            height={180}
            aria-label={`${ui.title} ${formatTime(from).slice(0, 5)}~${formatTime(to).slice(0, 5)}, ${stale ? '마지막 값' : '현재'} ${current === null ? '없음' : fmtMetric(current, ui.digits)} ${ui.unit}`}
          />
          <aside className="in-chart__side">
            <span className={`text-caption-12-medium ${stale ? 'in-warn' : 'in-muted'}`}>
              {stale ? `마지막 ${formatTime(new Date(lastT!).toISOString()).slice(0, 5)}` : '현재'}
            </span>
            <span className={`text-number-28${over ? ' in-warn' : ''}`}>{current === null ? '—' : fmtMetric(current, ui.digits)}</span>
            <span className="text-caption-12 in-muted">{ui.unit}</span>
            <ul className="in-legend text-caption-12">
              {ui.kind === 'bars' ? (
                <>
                  <li><i className="in-swatch in-swatch--avg" aria-hidden />정상</li>
                  <li><i className="in-swatch in-swatch--warn" aria-hidden />{ui.limit}ms 초과</li>
                </>
              ) : lines.length > 1 ? (
                lines.map((l, i) => (
                  <li key={l.name}><i className="in-swatch" style={{ background: chartColors().service[i % 6] }} aria-hidden />{l.name}</li>
                ))
              ) : (
                <>
                  <li><i className="in-swatch in-swatch--avg" aria-hidden />avg</li>
                  {ui.kind === 'maxline' ? (
                    <li><i className="in-swatch in-swatch--warn" aria-hidden />max</li>
                  ) : (
                    <li><i className="in-swatch in-swatch--band" aria-hidden />min–max</li>
                  )}
                </>
              )}
            </ul>
          </aside>
        </div>
      )}
    </Card>
  )
}

function optionOf(lines: ViewLine[], ui: MetricUi, from: number, to: number): ChartOption {
  const c = chartColors()
  const warn = resolveColor('var(--color-status-warn)')
  const fmt = (v: number) => fmtMetric(v, ui.digits)
  const first = lines[0].points
  const xy = (pick: (p: (typeof first)[number]) => number) => first.map((p) => [p.t, pick(p)])

  let series: unknown[]
  if (ui.kind === 'bars') {
    series = [
      {
        name: ui.title,
        type: 'bar',
        barMaxWidth: 14,
        data: first.map((p) => ({ value: [p.t, p.avg], itemStyle: { color: ui.limit !== undefined && p.avg > ui.limit ? warn : c.line.avg } })),
      },
    ]
  } else if (lines.length > 1) {
    // 속성 조합이 여러 줄이면 avg 선만 여러 개
    series = lines.map((l, i) => ({ name: l.name, type: 'line', showSymbol: false, lineStyle: { width: 1.5, color: c.service[i % 6] }, data: l.points.map((p) => [p.t, p.avg]) }))
  } else if (ui.kind === 'maxline') {
    series = [
      { name: 'avg', type: 'line', showSymbol: false, lineStyle: { width: 2, color: c.line.avg }, itemStyle: { color: c.line.avg }, data: xy((p) => p.avg) },
      { name: 'max', type: 'line', showSymbol: false, lineStyle: { width: 1, type: 'dashed', color: warn }, itemStyle: { color: warn }, data: xy((p) => p.max) },
    ]
  } else {
    // min–max 띠: 투명한 min 위에 (max − min) 을 쌓아 칠한다
    series = [
      { name: 'min', type: 'line', stack: 'band', showSymbol: false, lineStyle: { opacity: 0 }, data: xy((p) => p.min), tooltip: { show: false } },
      { name: 'band', type: 'line', stack: 'band', showSymbol: false, lineStyle: { opacity: 0 }, areaStyle: { color: c.line.band }, data: xy((p) => p.max - p.min) },
      { name: 'avg', type: 'line', showSymbol: false, lineStyle: { width: 2, color: c.line.avg }, itemStyle: { color: c.line.avg }, data: xy((p) => p.avg) },
    ]
  }

  return {
    grid: { left: 44, right: 12, top: 12, bottom: 24 },
    xAxis: { type: 'time', min: from, max: to, axisLabel: { formatter: (v: number) => formatTime(new Date(v).toISOString()).slice(0, 5), hideOverlap: true } },
    yAxis: { type: 'value', scale: ui.kind !== 'bars', axisLabel: { formatter: (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 1 }) } },
    tooltip: {
      trigger: 'axis',
      // 띠(쌓은 값)는 숫자가 헷갈리니 점 하나의 avg · min · max 를 직접 적는다
      formatter: (params: { dataIndex: number }[]) => {
        const i = params[0]?.dataIndex ?? 0
        const head = formatTime(new Date(first[i]?.t ?? 0).toISOString()).slice(0, 5)
        if (lines.length > 1) return [head, ...lines.map((l) => `${l.name}: ${fmt(l.points[i]?.avg ?? NaN)} ${ui.unit}`)].join('<br/>')
        const p = first[i]
        return p ? `${head}<br/>avg ${fmt(p.avg)} · min ${fmt(p.min)} · max ${fmt(p.max)} ${ui.unit}` : head
      },
    },
    series,
  }
}
