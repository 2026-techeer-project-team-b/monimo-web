import { useState, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listUrlStats, type UrlStat } from '@/api'
import { Badge, CursorPager, formatTime, Table, TableBody, TableCard, TableCell, TableHead, TableHeaderCell, TableRow, type Tone } from '@/design-system'

const LIMIT = 50
const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * 에러율 배지 색. 명세에 기준이 없어 시안(3.75 · 1.85 · 1.40% 빨강, 0.56% 노랑, 0.40% 이하 회색)에 맞춘 값이다
 */
function errorRateTone(rate: number): Tone {
  if (rate >= 0.01) return 'crit'
  if (rate >= 0.005) return 'warn'
  return 'muted'
}

type Props = { serviceName: string; from: string; to: string; agentKey: string; tabs: ReactNode }

/** URL 통계 탭 — URL(span_name) 별 호출 수 · 에러율 · 응답시간 백분위 */
export function UrlStatsTable({ serviceName, from, to, agentKey, tabs }: Props) {
  // 조건(서비스 · 파드)이 바뀌면 첫 쪽부터. 시간 창은 자동 새로고침마다 바뀌므로 커서 기록을 지우는 조건에서 뺀다
  // (새로고침마다 첫 쪽으로 튀지 않게). 그 사이 목록이 짧아져 쪽이 비면 「첫 쪽으로」를 보여 준다
  const key = JSON.stringify([serviceName, agentKey])
  const [pages, setPages] = useState<{ key: string; cursors: (string | null)[] }>({ key, cursors: [null] })
  const cursors = pages.key === key ? pages.cursors : [null]
  const cursor = cursors[cursors.length - 1]

  const { data, isError, isFetching } = useQuery({
    queryKey: ['url-stats', serviceName, from, to, agentKey, cursor, LIMIT],
    queryFn: ({ signal }) => listUrlStats({ serviceName, from, to, agentKey: agentKey || undefined, cursor, limit: LIMIT }, signal),
    placeholderData: keepPreviousData,
  })
  const rows: UrlStat[] = data?.items ?? []

  return (
    <TableCard
      tabs={tabs}
      className={isFetching ? 'tx-table is-loading' : 'tx-table'}
      toolbar={
        <>
          <span>집계 조건</span>
          <Badge className="text-mono-11">service_name {serviceName}</Badge>
          <Badge className="text-mono-11">from {formatTime(from).slice(0, 5)}</Badge>
          <Badge className="text-mono-11">to {formatTime(to).slice(0, 5)}</Badge>
          {agentKey ? <Badge className="text-mono-11">agent_key {agentKey}</Badge> : null}
        </>
      }
      summary={`${fmt(rows.length)}개 URL · 서버 순서(호출 수) · limit ${LIMIT} · 커서 페이징`}
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
        <p className="tx-empty text-body-13" role="alert">URL 통계를 불러오지 못했습니다.</p>
      ) : !data ? (
        <p className="tx-empty text-body-13" role="status">불러오는 중…</p>
      ) : rows.length === 0 && cursors.length > 1 ? (
        // 자동 새로고침으로 시간 창이 움직여 목록이 짧아지면 지금 쪽이 비어 버릴 수 있다
        <p className="tx-empty text-body-13" role="status">
          새로고침으로 목록이 바뀌어 이 쪽이 비었습니다.{' '}
          <button type="button" className="tx-linkbtn" onClick={() => setPages({ key, cursors: [null] })}>첫 쪽으로</button>
        </p>
      ) : rows.length === 0 ? (
        <p className="tx-empty text-body-13" role="status">이 시간 범위에 기록된 요청이 없습니다.</p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>span_name</TableHeaderCell>
              <TableHeaderCell align="right">cnt</TableHeaderCell>
              <TableHeaderCell align="right">err_cnt</TableHeaderCell>
              <TableHeaderCell align="right">error_rate</TableHeaderCell>
              <TableHeaderCell align="right">p50_ms</TableHeaderCell>
              <TableHeaderCell align="right">p95_ms</TableHeaderCell>
              <TableHeaderCell align="right">p99_ms</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.span_name}>
                <TableCell type="mono">{r.span_name}</TableCell>
                <TableCell type="number">{fmt(r.cnt)}</TableCell>
                <TableCell type="number" className={r.err_cnt > 0 ? 'tx-crit' : undefined}>{fmt(r.err_cnt)}</TableCell>
                <TableCell type="number">
                  <Badge tone={errorRateTone(r.error_rate)} className="text-mono-11">{(r.error_rate * 100).toFixed(2)}%</Badge>
                </TableCell>
                <TableCell type="number">{fmt(r.p50_ms)}</TableCell>
                <TableCell type="number" className="tx-strong">{fmt(r.p95_ms)}</TableCell>
                <TableCell type="number">{fmt(r.p99_ms)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableCard>
  )
}
