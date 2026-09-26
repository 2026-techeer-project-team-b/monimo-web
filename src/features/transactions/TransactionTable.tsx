import { useState, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listTransactions } from '@/api'
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
import { isErrorOf, type ResultFilter, type Selection } from './selection'

const LIMIT = 50
const hm = (iso: string) => formatTime(iso).slice(0, 5)

type Props = {
  serviceName: string
  selection: Selection | null
  agentKey: string
  result: ResultFilter
  /** 카드 위 탭 (요청 목록 · URL 통계) */
  tabs: ReactNode
}

/** 선택 영역 요청 목록 — 느린 순 · 커서 페이징 */
export function TransactionTable({ serviceName, selection, agentKey, result, tabs }: Props) {
  // 커서 기록. 조건이 바뀌면(key 가 달라지면) 첫 쪽부터
  const key = JSON.stringify([serviceName, selection, agentKey, result])
  const [pages, setPages] = useState<{ key: string; cursors: (string | null)[] }>({ key, cursors: [null] })
  const cursors = pages.key === key ? pages.cursors : [null]
  const cursor = cursors[cursors.length - 1]

  const { data, isError, isFetching } = useQuery({
    queryKey: ['transactions', serviceName, selection, agentKey, result, cursor],
    queryFn: ({ signal }) =>
      listTransactions(
        {
          serviceName,
          from: selection!.from,
          to: selection!.to,
          minDurationMs: selection!.minMs,
          maxDurationMs: selection!.maxMs,
          agentKey: agentKey || undefined,
          isError: isErrorOf(result),
          cursor,
          limit: LIMIT,
        },
        signal,
      ),
    enabled: !!selection,
    placeholderData: keepPreviousData,
  })

  if (!selection) {
    return (
      <TableCard tabs={tabs}>
        <p className="tx-empty text-body-13" role="status">위 차트(스캐터 · 히트맵)에서 영역을 드래그하면 그 안의 요청이 느린 순으로 나옵니다.</p>
      </TableCard>
    )
  }

  return (
    <TableCard
      tabs={tabs}
      toolbar={
        <>
          <span>드래그 선택 조건</span>
          <Badge className="text-mono-11">from {hm(selection.from)}</Badge>
          <Badge className="text-mono-11">to {hm(selection.to)}</Badge>
          <Badge className="text-mono-11">min_duration_ms {selection.minMs.toLocaleString('en-US')}</Badge>
          <Badge className="text-mono-11">max_duration_ms {selection.maxMs.toLocaleString('en-US')}</Badge>
          <Badge className="text-mono-11">service_name {serviceName}</Badge>
          {agentKey ? <Badge className="text-mono-11">agent_key {agentKey}</Badge> : null}
          {result !== 'all' ? <Badge className="text-mono-11">is_error {String(result === 'fail')}</Badge> : null}
        </>
      }
      className={isFetching ? 'tx-table is-loading' : 'tx-table'}
      summary={`느린 순 · limit ${LIMIT} · 커서 페이징`}
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
        <p className="tx-empty text-body-13" role="alert">요청 목록을 불러오지 못했습니다.</p>
      ) : data && data.items.length === 0 ? (
        <p className="tx-empty text-body-13" role="status">선택한 영역에 요청이 없습니다.</p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>시각 start_time</TableHeaderCell>
              <TableHeaderCell>service_name</TableHeaderCell>
              <TableHeaderCell>span_name (URL)</TableHeaderCell>
              <TableHeaderCell align="right">duration_ms</TableHeaderCell>
              <TableHeaderCell>http_status</TableHeaderCell>
              <TableHeaderCell>is_error</TableHeaderCell>
              <TableHeaderCell>agent_key</TableHeaderCell>
              <TableHeaderCell>trace_id</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.items ?? []).map((t) => (
              <TableRow key={t.trace_id}>
                <TableCell type="mono">{formatTime(t.start_time)}</TableCell>
                <TableCell>{t.service_name}</TableCell>
                <TableCell type="mono">{t.span_name}</TableCell>
                <TableCell type="number" className={t.is_error ? 'tx-crit' : undefined}>{t.duration_ms.toLocaleString('en-US')}</TableCell>
                <TableCell type="badge">
                  {t.http_status == null ? '-' : <Badge tone={httpStatusTone(t.http_status)}>{t.http_status}</Badge>}
                </TableCell>
                <TableCell type="badge">
                  <Badge tone={t.is_error ? 'crit' : 'muted'}>{t.is_error ? '실패' : '정상'}</Badge>
                </TableCell>
                <TableCell type="mono">{t.agent_key}</TableCell>
                <TableCell type="mono" title={t.trace_id}>{shortId(t.trace_id)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableCard>
  )
}
