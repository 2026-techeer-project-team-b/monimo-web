import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listErrors } from '@/api'
import {
  Badge,
  CursorPager,
  formatTime,
  httpStatusTone,
  shortId,
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/design-system'
import { useOpenTrace, useOpenTraceId } from '@/shared'
import type { ErrorFilters } from './useErrorFilters'

const LIMIT = 50

type Props = {
  serviceName: string
  from: string
  to: string
  filters: ErrorFilters
  /** 타임라인으로 센 건수 (파드 · 상태코드 필터가 걸리면 셀 수 없어 null) */
  total: number | null
}

/** 실패 스팬 표 — 시간 역순 · 커서 페이징, 행을 누르면 트레이스 상세 드로어 */
export function ErrorTable({ serviceName, from, to, filters, total }: Props) {
  const { open } = useOpenTrace()
  const openId = useOpenTraceId()

  // 서비스 · 필터가 바뀌면 첫 쪽부터. 시간 창은 자동 새로고침마다 바뀌어 커서 기록을 지우는 조건에서 뺀다
  const key = JSON.stringify([serviceName, filters])
  const [pages, setPages] = useState<{ key: string; cursors: (string | null)[] }>({ key, cursors: [null] })
  const cursors = pages.key === key ? pages.cursors : [null]
  const cursor = cursors[cursors.length - 1]

  const { data, isError, isFetching } = useQuery({
    queryKey: ['errors', serviceName, from, to, filters, cursor],
    queryFn: ({ signal }) =>
      listErrors(
        {
          serviceName,
          from,
          to,
          agentKey: filters.agentKey || undefined,
          httpStatus: filters.httpStatus ? Number(filters.httpStatus) : undefined,
          exceptionType: filters.exceptionType || undefined,
          cursor,
          limit: LIMIT,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
  })
  const rows = data?.items ?? []

  return (
    <TableCard
      title={`실패 스팬${total === null ? '' : ` (${total.toLocaleString('en-US')})`}`}
      actions={<span className="text-caption-12 er-muted">message = exception_message · duration = duration_ns 환산</span>}
      className={isFetching ? 'er-table is-loading' : 'er-table'}
      summary={`시간 역순 · limit ${LIMIT} · 커서 페이징`}
      pager={
        <CursorPager
          hasPrev={cursors.length > 1}
          hasNext={!!data?.nextCursor}
          onPrev={() => setPages({ key, cursors: cursors.slice(0, -1) })}
          onNext={() => data?.nextCursor && setPages({ key, cursors: [...cursors, data.nextCursor] })}
        />
      }
    >
      {isError && !data ? (
        <p className="er-empty text-body-13" role="alert">실패 스팬을 불러오지 못했습니다.</p>
      ) : !data ? (
        <p className="er-empty text-body-13" role="status">불러오는 중…</p>
      ) : rows.length === 0 && cursors.length > 1 ? (
        <p className="er-empty text-body-13" role="status">
          새로고침으로 목록이 바뀌어 이 쪽이 비었습니다.{' '}
          <button type="button" className="er-linkbtn" onClick={() => setPages({ key, cursors: [null] })}>첫 쪽으로</button>
        </p>
      ) : rows.length === 0 ? (
        <p className="er-empty text-body-13" role="status">조건에 맞는 실패가 없습니다.</p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>start_time</TableHeaderCell>
              <TableHeaderCell>service_name</TableHeaderCell>
              <TableHeaderCell>span_name</TableHeaderCell>
              <TableHeaderCell>http_status</TableHeaderCell>
              <TableHeaderCell>exception_type</TableHeaderCell>
              <TableHeaderCell>message</TableHeaderCell>
              <TableHeaderCell align="right">duration</TableHeaderCell>
              <TableHeaderCell>agent_key</TableHeaderCell>
              <TableHeaderCell>trace_id</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((e) => (
              <TableRow
                key={`${e.trace_id}-${e.span_id}`}
                onClick={() => open(e.trace_id)}
                selected={openId === e.trace_id}
                aria-label={`${e.exception_type ?? '실패'} ${e.span_name} 트레이스 열기`}
              >
                <TableCell type="mono">{formatTime(e.start_time)}</TableCell>
                <TableCell>{e.service_name}</TableCell>
                <TableCell type="mono" className="er-clip" title={e.span_name}>{e.span_name}</TableCell>
                <TableCell type="badge">
                  {e.http_status == null ? '—' : <Badge tone={httpStatusTone(e.http_status)}>{e.http_status}</Badge>}
                </TableCell>
                <TableCell type="mono" className="er-crit">{e.exception_type ?? '—'}</TableCell>
                <TableCell className="er-message" title={e.exception_message ?? ''}>{e.exception_message ?? '—'}</TableCell>
                <TableCell type="number">{Math.round(e.duration_ns / 1e6).toLocaleString('en-US')}</TableCell>
                <TableCell type="mono" className="er-clip" title={e.agent_key}>{e.agent_key}</TableCell>
                <TableCell type="mono" title={e.trace_id}>{shortId(e.trace_id)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableCard>
  )
}
