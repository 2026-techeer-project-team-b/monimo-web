import { useEffect, useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getErrorTimeline, listAgents } from '@/api'
import { Button, Card, formatTime } from '@/design-system'
import { useServiceName, useTimeWindow } from '@/stores'
import { ErrorFilterBar } from './ErrorFilterBar'
import { ErrorTable } from './ErrorTable'
import { ErrorTimelineCard } from './ErrorTimelineCard'
import { errorStepSec, toView } from './timeline'
import { useErrorFilters } from './useErrorFilters'
import './Errors.css'

/** 에러 분석 (S06) — 시간대별 에러 막대(상태코드 대역 · 예외 타입)와 실패 스팬 표 */
export function ErrorsPage() {
  const serviceName = useServiceName()
  if (!serviceName) {
    return (
      <Card title="서비스를 골라 주세요">
        <p className="er-empty text-body-13">에러 분석은 서비스 하나씩 봅니다. 상단바에서 서비스를 고르면 시간대별 에러와 실패 스팬이 나옵니다.</p>
      </Card>
    )
  }
  return <ServiceErrors serviceName={serviceName} />
}

function ServiceErrors({ serviceName }: { serviceName: string }) {
  const { from, to } = useTimeWindow()
  const { filters, setFilters } = useErrorFilters()
  const step = errorStepSec(from, to)

  const timeline = useQuery({
    queryKey: ['errors-timeline', serviceName, from, to, step],
    queryFn: ({ signal }) => getErrorTimeline({ serviceName, from, to, step }, signal),
    placeholderData: keepPreviousData,
  })
  const agents = useQuery({
    queryKey: ['agents', serviceName],
    queryFn: ({ signal }) => listAgents({ serviceName, limit: 500 }, signal),
    staleTime: 5 * 60_000,
  })

  // 막대로 고른 칸. 시간 범위를 바꿔 칸이 창 밖으로 나갔거나, 칸 크기(step)가 바뀌어 칸 경계와 어긋나면 무시한다
  const stepMs = step * 1000
  const gridStart = Math.floor(Date.parse(from) / stepMs) * stepMs
  const atMs = filters.at ? Number(filters.at) : NaN
  const at = Number.isFinite(atMs) && atMs >= gridStart && atMs < Date.parse(to) && (atMs - gridStart) % stepMs === 0 ? atMs : null
  // 무시된 칸은 주소에서도 지운다 — 남겨 두면 나중에 시간 범위가 다시 그 칸을 덮을 때 누르지도 않은 선택이 되살아난다
  const staleAt = !!filters.at && at === null && !!timeline.data
  useEffect(() => {
    if (staleAt) setFilters({ at: '' })
  }, [staleAt, setFilters])
  const tableFrom = at === null ? from : new Date(at).toISOString()
  const tableTo = at === null ? to : new Date(Math.min(at + stepMs, Date.parse(to))).toISOString()

  // 표 제목의 건수: 타임라인에는 파드 · 상태코드가 없어서, 그 필터가 걸리면 세지 않는다
  const total = useMemo(() => {
    if (!timeline.data || filters.agentKey || filters.httpStatus) return null
    // 칸을 골랐으면 그 칸만, 예외 타입도 골랐으면 칸 합계를 셀 수 없어(칸별 예외 타입 합계가 없음) 세지 않는다
    if (at !== null) {
      if (filters.exceptionType) return null
      const view = toView(timeline.data, from, to)
      const i = view.xs.indexOf(at)
      return i < 0 ? null : view.byClass['5xx'][i] + view.byClass['4xx'][i] + view.byClass.other[i]
    }
    const view = toView(timeline.data, from, to)
    return filters.exceptionType ? (view.types.find((t) => t.type === filters.exceptionType)?.cnt ?? 0) : view.total
  }, [timeline.data, from, to, filters, at])

  return (
    <div className="er-page">
      <ErrorTimelineCard
        timeline={timeline.data}
        isError={timeline.isError}
        from={from}
        to={to}
        exceptionType={filters.exceptionType}
        onExceptionType={(exceptionType) => setFilters({ exceptionType })}
        selectedAt={at}
        onBar={(ms) => setFilters({ at: ms === null ? '' : String(ms) })}
      />
      <ErrorFilterBar filters={filters} agents={agents.data?.items ?? []} onApply={setFilters} />
      {at !== null ? (
        <div className="er-at" role="status">
          <span className="text-body-13">
            막대로 고른 칸 <span className="text-mono-12-strong">{formatTime(tableFrom).slice(0, 5)} ~ {formatTime(tableTo).slice(0, 5)}</span> 의 실패 스팬만 보는 중
          </span>
          <Button onClick={() => setFilters({ at: '' })}>전체 구간 보기</Button>
        </div>
      ) : null}
      <ErrorTable serviceName={serviceName} from={tableFrom} to={tableTo} filters={{ ...filters, at: at === null ? '' : String(at) }} total={total} />
    </div>
  )
}
