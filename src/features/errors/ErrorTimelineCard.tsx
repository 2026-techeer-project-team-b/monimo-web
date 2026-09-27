import { useMemo } from 'react'
import type { ErrorTimeline } from '@/api'
import { Card, formatTime } from '@/design-system'
import { EChart, resolveColor, type ChartOption } from '@/shared'
import { CLASSES, toView } from './timeline'

const fmt = (n: number) => n.toLocaleString('en-US')
const TOP = 4

type Props = {
  timeline: ErrorTimeline | undefined
  isError: boolean
  from: string
  to: string
  /** 지금 표에 걸린 예외 타입 (강조 표시) */
  exceptionType: string
  onExceptionType: (type: string) => void
  /** 막대를 눌러 고른 칸의 시작 시각(ms). 없으면 null */
  selectedAt: number | null
  /** 막대 클릭 — 그 칸 시작 시각. 같은 칸을 다시 누르면 null(풀기) */
  onBar: (at: number | null) => void
}

/** 시간대별 에러 건수 — 상태코드 대역으로 쌓은 막대, 합계, 예외 타입 상위 */
export function ErrorTimelineCard({ timeline, isError, from, to, exceptionType, onExceptionType, selectedAt, onBar }: Props) {
  const view = useMemo(() => (timeline ? toView(timeline, from, to) : null), [timeline, from, to])

  const option = useMemo<ChartOption | null>(() => {
    if (!view) return null
    const color = { '5xx': resolveColor('var(--color-status-crit)'), '4xx': resolveColor('var(--color-status-warn)'), other: resolveColor('var(--color-status-muted)') }
    return {
      grid: { left: 36, right: 12, top: 16, bottom: 28 },
      xAxis: { type: 'category', data: view.xs.map((t) => formatTime(t).slice(0, 5)), axisTick: { alignWithLabel: true } },
      yAxis: { type: 'value', minInterval: 1, name: '건', nameGap: 8 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      series: CLASSES.filter((c) => view.classTotal[c] > 0).map((c) => ({
        name: c,
        type: 'bar',
        stack: 'errors',
        barCategoryGap: '20%',
        itemStyle: { color: color[c] },
        // 고른 칸이 있으면 나머지 칸은 흐리게
        data: view.byClass[c].map((v, i) => ({ value: v, itemStyle: { opacity: selectedAt === null || view.xs[i] === selectedAt ? 1 : 0.3 } })),
      })),
    }
  }, [view, selectedAt])

  // 막대(칸)를 누르면 표를 그 칸 시간으로 좁힌다
  const onEvents = useMemo(
    () => ({
      click: (e: unknown) => {
        const i = (e as { dataIndex?: number }).dataIndex
        const x = i === undefined ? undefined : view?.xs[i]
        if (x !== undefined) onBar(x === selectedAt ? null : x)
      },
    }),
    [view, selectedAt, onBar],
  )

  const top = view?.types.slice(0, TOP) ?? []
  const rest = view?.types.slice(TOP) ?? []

  return (
    <Card className="er-timeline">
      <div className="er-timeline__head">
        <div>
          <h2 className="text-section-15 er-title">시간대별 에러 건수</h2>
          <p className="text-caption-12 er-muted">상태코드 대역으로 쌓고, 예외 타입은 오른쪽에서 고른다 · 막대를 누르면 표가 그 시간 칸만 보인다 · {formatTime(from).slice(0, 5)} ~ {formatTime(to).slice(0, 5)}</p>
        </div>
        {view ? (
          <dl className="er-kpis">
            <div><dt className="text-caption-12-medium">총 에러</dt><dd className="text-number-28">{fmt(view.total)}</dd></div>
            <div><dt className="text-caption-12-medium">5xx</dt><dd className="text-number-28 er-crit">{fmt(view.classTotal['5xx'])}</dd></div>
            <div><dt className="text-caption-12-medium">4xx</dt><dd className="text-number-28 er-warn">{fmt(view.classTotal['4xx'])}</dd></div>
          </dl>
        ) : null}
      </div>
      {isError && !view ? (
        <p className="er-empty text-body-13" role="alert">에러 건수를 불러오지 못했습니다.</p>
      ) : !view || !option ? (
        <p className="er-empty text-body-13" role="status">불러오는 중…</p>
      ) : (
        <div className="er-timeline__body">
          <EChart
            className="er-timeline__chart"
            option={option}
            height={220}
            onEvents={onEvents}
            aria-label={`시간대별 에러 막대: 총 ${view.total}건, 5xx ${view.classTotal['5xx']}건, 4xx ${view.classTotal['4xx']}건${view.classTotal.other ? `, 상태코드 없음 ${view.classTotal.other}건` : ''}`}
          />
          <aside className="er-legend" aria-label="에러 분류">
            <h3 className="text-caption-12-medium">http_status_class</h3>
            <ul>
              <li><i className="er-swatch er-swatch--crit" aria-hidden />5xx<span className="er-crit text-mono-12">{fmt(view.classTotal['5xx'])}</span></li>
              <li><i className="er-swatch er-swatch--warn" aria-hidden />4xx<span className="er-warn text-mono-12">{fmt(view.classTotal['4xx'])}</span></li>
              {/* 상태코드 없이 실패한 스팬(내부 · gRPC 등). 막대의 회색 */}
              {view.classTotal.other ? (
                <li><i className="er-swatch er-swatch--other" aria-hidden />상태코드 없음<span className="text-mono-12">{fmt(view.classTotal.other)}</span></li>
              ) : null}
            </ul>
            <h3 className="text-caption-12-medium">exception_type 상위 {TOP}</h3>
            {top.length === 0 ? (
              <p className="text-caption-12 er-muted">이 시간 범위에 에러가 없습니다.</p>
            ) : (
              <ul>
                {top.map((t) => (
                  <li key={t.type}>
                    {/* 누르면 아래 표가 이 예외 타입으로 걸러진다. 다시 누르면 해제 */}
                    <button
                      type="button"
                      className="er-type text-mono-11"
                      aria-pressed={exceptionType === t.type}
                      onClick={() => onExceptionType(exceptionType === t.type ? '' : t.type)}
                      title={`${t.type} 만 보기`}
                    >
                      {t.type}
                    </button>
                    <span className="text-mono-12">{fmt(t.cnt)}</span>
                  </li>
                ))}
              </ul>
            )}
            {rest.length ? (
              <p className="text-caption-12 er-muted">그 외 {rest.length}종 합계 {fmt(rest.reduce((s, t) => s + t.cnt, 0))}건</p>
            ) : null}
          </aside>
        </div>
      )}
      {view ? <p className="text-caption-12 er-muted er-foot">step {timeline!.step}초 · GET /errors/timeline</p> : null}
    </Card>
  )
}
