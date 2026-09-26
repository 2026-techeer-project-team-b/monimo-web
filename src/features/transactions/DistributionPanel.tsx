import { useMemo } from 'react'
import type { Agent, Heatmap, Scatter } from '@/api'
import { Badge, Card, formatTime, Segmented, Select } from '@/design-system'
import { chartColors, heatmapVisualMap, type ChartOption } from '@/shared'
import { BrushChart, type BrushRange } from './BrushChart'
import { BANDS, gridToSelection, selectionToGrid, toGrid, type GridCell } from './heatmap'
import { filterByResult, toCoordRange, toSelection, type ResultFilter, type Selection } from './selection'

const fmt = (n: number) => n.toLocaleString('en-US')

export type View = 'scatter' | 'heatmap'

type Props = {
  view: View
  onView: (v: View) => void
  scatter: Scatter | undefined
  scatterError: boolean
  heatmap: Heatmap | undefined
  heatmapError: boolean
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

/** 응답시간 분포 카드 — 스캐터 ↔ 히트맵, 파드 · 결과 필터, 드래그 선택 */
export function DistributionPanel(p: Props) {
  const { view, scatter, heatmap, from, to, result, selection } = p
  const colors = chartColors()

  // ── 스캐터 ── 결과 필터는 화면에서 거른다 (스캐터 API 에는 is_error 파라미터가 없다)
  const points = useMemo(() => filterByResult(scatter?.points ?? [], result), [scatter, result])
  const okCount = points.filter((x) => !x.is_error).length
  const failCount = points.length - okCount
  const scatterOption = useMemo<ChartOption>(() => {
    const c = chartColors()
    const dot = (x: (typeof points)[number]): Dot => ({ value: [Date.parse(x.start_time), x.duration_ms], span: x.span_name, status: x.http_status })
    return {
      grid: { left: 52, right: 16, top: 16, bottom: 28 },
      xAxis: { type: 'time', min: Date.parse(from), max: Date.parse(to) },
      // 느린 요청과 빠른 요청을 한 화면에 보려고 세로축은 로그 눈금
      yAxis: { type: 'log', logBase: 10, min: 1, name: 'ms', nameGap: 8 },
      tooltip: { trigger: 'item', formatter: (e: { data: Dot }) => `${e.data.span}<br/>${fmt(e.data.value[1])} ms · ${e.data.status ?? '-'}` },
      series: [
        { name: '성공', type: 'scatter', symbolSize: 5, itemStyle: { color: c.scatter.ok }, data: points.filter((x) => !x.is_error).map(dot) },
        { name: '실패', type: 'scatter', symbolSize: 6, itemStyle: { color: c.scatter.fail }, data: points.filter((x) => x.is_error).map(dot) },
      ],
    }
  }, [points, from, to])

  // ── 히트맵 ──
  const grid = useMemo(() => (heatmap ? toGrid(heatmap, from, to) : null), [heatmap, from, to])
  const heatmapOption = useMemo<ChartOption | null>(() => {
    if (!grid) return null
    return {
      grid: { left: 84, right: 16, top: 16, bottom: 28 },
      xAxis: { type: 'category', data: grid.xs.map((t) => formatTime(t).slice(0, 5)), splitLine: { show: false } },
      yAxis: { type: 'category', data: BANDS.map((b) => b.label), name: 'ms', nameGap: 8, splitLine: { show: false } },
      visualMap: heatmapVisualMap(),
      tooltip: {
        trigger: 'item',
        formatter: (e: { data: GridCell }) => {
          const [x, y, cnt, , err] = e.data
          return `${formatTime(grid.xs[x]).slice(0, 5)} · ${BANDS[y].label} ms<br/>${fmt(cnt)}건${err ? ` · 실패 ${fmt(err)}` : ''}`
        },
      },
      series: [{ type: 'heatmap', data: grid.cells, emphasis: { disabled: true } }],
    }
  }, [grid])

  const range: BrushRange | null = !selection ? null : view === 'scatter' ? toCoordRange(selection) : grid ? selectionToGrid(grid, selection) : null
  const onRange = (r: BrushRange | null) => p.onSelection(!r ? null : view === 'scatter' ? toSelection(r) : grid ? gridToSelection(grid, r) : null)

  const data = view === 'scatter' ? scatter : heatmap
  const failed = view === 'scatter' ? p.scatterError : p.heatmapError
  const option = view === 'scatter' ? scatterOption : heatmapOption

  return (
    <Card
      className="tx-scatter"
      title={
        <span className="tx-title">
          응답시간 분포
          {view === 'scatter' && scatter ? (
            <Badge tone={scatter.mode === 'bucketed' ? 'warn' : 'accent'} className="text-mono-11">
              mode {scatter.mode} · {fmt(scatter.points.length)}점
            </Badge>
          ) : null}
          {view === 'heatmap' && heatmap ? (
            <Badge tone="accent" className="text-mono-11">
              step {heatmap.step}s · bucket {heatmap.bucket_width_ms}ms
            </Badge>
          ) : null}
        </span>
      }
      actions={
        <div className="tx-filters">
          <Segmented
            aria-label="보기"
            value={view}
            onChange={p.onView}
            options={[
              { value: 'scatter', label: '스캐터' },
              { value: 'heatmap', label: '히트맵' },
            ]}
          />
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
        {view === 'scatter' ? (
          <>
            <span><i className="tx-dot tx-dot--ok" aria-hidden />성공 {fmt(okCount)}</span>
            <span><i className="tx-dot tx-dot--fail" aria-hidden />실패 {fmt(failCount)}</span>
          </>
        ) : (
          <>
            <span className="tx-legend">
              농도 = cnt
              {colors.heatmap.levels.map((c) => (
                <i key={c} className="tx-swatch" style={{ background: c }} aria-hidden />
              ))}
            </span>
            <span><i className="tx-swatch" style={{ background: colors.heatmap.error }} aria-hidden />실패가 있는 칸</span>
            {p.agentKey || result !== 'all' ? <span className="tx-note">히트맵은 파드 · 결과 필터 없이 서비스 전체를 셉니다</span> : null}
          </>
        )}
        {selection ? (
          <span className="tx-scatter__picked">
            {p.count ? `선택 ${fmt(p.count.total)}건 · 실패 ${fmt(p.count.failed)}` : '영역 선택됨 (건수는 아래 표에서)'}
            <button type="button" className="tx-linkbtn" onClick={() => p.onSelection(null)}>선택 해제</button>
          </span>
        ) : (
          <span className="tx-scatter__hint">차트를 드래그해 사각형으로 긁으면 그 안의 요청이 아래 표에 나옵니다.</span>
        )}
      </div>
      {view === 'scatter' && scatter?.mode === 'bucketed' ? (
        <p className="tx-note text-caption-12">점이 많아 서버가 격자로 접었습니다(mode bucketed). 범위를 좁히거나 히트맵으로 보면 빠짐없이 셉니다.</p>
      ) : null}
      {failed && !data ? (
        <p className="tx-empty text-body-13" role="alert">응답시간 분포를 불러오지 못했습니다.</p>
      ) : !data || !option ? (
        <p className="tx-empty text-body-13" role="status">불러오는 중…</p>
      ) : (
        <BrushChart
          // 보기를 바꾸면 다른 좌표계라 차트를 새로 만든다
          key={view}
          option={option}
          range={range}
          onRange={onRange}
          color={colors.line.avg}
          height={320}
          aria-label={
            view === 'scatter'
              ? `응답시간 스캐터: 성공 ${okCount}건, 실패 ${failCount}건. 드래그로 영역을 고르면 요청 목록이 나옵니다.`
              : '응답시간 히트맵: 시각 × 지연 구간별 건수, 실패가 있는 칸은 빨강. 드래그로 영역을 고르면 요청 목록이 나옵니다.'
          }
        />
      )}
    </Card>
  )
}
