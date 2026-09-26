import { useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getErrorTimeline, listAgents } from '@/api'
import { Card } from '@/design-system'
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

  // 표 제목의 건수: 타임라인에는 파드 · 상태코드가 없어서, 그 필터가 걸리면 세지 않는다
  const total = useMemo(() => {
    if (!timeline.data || filters.agentKey || filters.httpStatus) return null
    const view = toView(timeline.data, from, to)
    return filters.exceptionType ? (view.types.find((t) => t.type === filters.exceptionType)?.cnt ?? 0) : view.total
  }, [timeline.data, from, to, filters])

  return (
    <div className="er-page">
      <ErrorTimelineCard
        timeline={timeline.data}
        isError={timeline.isError}
        from={from}
        to={to}
        exceptionType={filters.exceptionType}
        onExceptionType={(exceptionType) => setFilters({ exceptionType })}
      />
      <ErrorFilterBar filters={filters} agents={agents.data?.items ?? []} onApply={setFilters} />
      <ErrorTable serviceName={serviceName} from={from} to={to} filters={filters} total={total} />
    </div>
  )
}
