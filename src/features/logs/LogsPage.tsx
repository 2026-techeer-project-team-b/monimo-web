import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ApiError, listAgents, listLogs } from '@/api'
import { Button, TableCard } from '@/design-system'
import { LogTable } from '@/shared'
import { useServiceName, useTimeWindow } from '@/stores'
import { LogFilterBar } from './LogFilterBar'
import { useLogFilters } from './useLogFilters'
import './Logs.css'

const LIMIT = 50

/** 로그 검색 (S07) — 레벨 · logger · trace_id · 본문으로 찾고, trace_id 로 트레이스 상세에 들어간다 */
export function LogsPage() {
  // 로그는 서비스를 고르지 않아도(전체) 찾을 수 있다 (명세 service_name?)
  const serviceName = useServiceName()
  const { from, to } = useTimeWindow()
  const { filters, setFilters } = useLogFilters()

  const agents = useQuery({
    queryKey: ['agents', serviceName],
    queryFn: ({ signal }) => listAgents({ serviceName, limit: 500 }, signal),
    enabled: !!serviceName,
    staleTime: 5 * 60_000,
  })

  // 「더 보기」로 아래에 이어 붙인다. 시간 창(자동 새로고침)이나 필터가 바뀌면 첫 쪽부터 다시
  const logs = useInfiniteQuery({
    queryKey: ['logs', serviceName, from, to, filters],
    queryFn: ({ pageParam, signal }) =>
      listLogs(
        {
          serviceName,
          from,
          to,
          agentKey: filters.agentKey || undefined,
          levels: filters.levels,
          logger: filters.logger || undefined,
          traceId: filters.traceId || undefined,
          q: filters.q || undefined,
          cursor: pageParam,
          limit: LIMIT,
        },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  })
  const rows = logs.data?.pages.flatMap((p) => p.items) ?? []
  const code = logs.error instanceof ApiError ? logs.error.code : ''

  return (
    <div className="lg-page">
      <LogFilterBar filters={filters} agents={agents.data?.items ?? []} showAgents={!!serviceName} onApply={setFilters} />
      <TableCard
        title="검색 결과"
        actions={<span className="text-caption-12 lg-muted">행을 펼치면 attributes 를 본다 · trace_id 를 누르면 콜스택으로</span>}
        className={logs.isFetching && !logs.isFetchingNextPage ? 'lg-table is-loading' : 'lg-table'}
        summary={`${rows.length.toLocaleString('en-US')}건 표시 · ts 역순 · limit ${LIMIT} · 커서 페이징`}
        pager={
          logs.hasNextPage ? (
            <Button onClick={() => logs.fetchNextPage()} disabled={logs.isFetchingNextPage}>
              {logs.isFetchingNextPage ? '불러오는 중…' : `더 보기 (${LIMIT}건)`}
            </Button>
          ) : null
        }
      >
        {logs.isError && !logs.data ? (
          <p className="lg-empty text-body-13" role="alert">
            {code === 'SIGNAL_EXPIRED'
              ? '보관 기간(97일)이 지난 범위라 로그가 지워졌습니다. 시간 범위를 줄여 주세요.'
              : `로그를 불러오지 못했습니다. ${code ? `(${code})` : ''}`}
          </p>
        ) : !logs.data ? (
          <p className="lg-empty text-body-13" role="status">
            불러오는 중…
          </p>
        ) : rows.length === 0 ? (
          <p className="lg-empty text-body-13" role="status">
            조건에 맞는 로그가 없습니다.
          </p>
        ) : (
          // 서비스를 골랐으면 모든 행이 같은 서비스라 그 칸은 뺀다
          <LogTable rows={rows} q={filters.q} hideService={!!serviceName} />
        )}
      </TableCard>
    </div>
  )
}
