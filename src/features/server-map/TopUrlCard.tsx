import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { listUrlStats } from '@/api'
import { Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/design-system'
import { useFilterHref, useTimeWindow } from '@/stores'
import { CardNotice } from './CardNotice'
import { fmtCount } from './model'

const TOP = 3
/**
 * p95 가 이 값 이상이면 빨갛게. 명세에 기준이 없어 시안의 경보 예시(P95_LATENCY 기준 800 ms)에 맞춘 값이다
 */
const SLOW_P95_MS = 800

/** 선택한 서비스에서 가장 많이 불린 URL 3개 */
export function TopUrlCard({ serviceName, notice }: { serviceName: string | null; notice: string }) {
  const href = useFilterHref()
  const { from, to } = useTimeWindow()
  const { data, isError } = useQuery({
    queryKey: ['url-stats', serviceName, from, to, TOP],
    queryFn: ({ signal }) => listUrlStats({ serviceName: serviceName!, from, to, limit: TOP }, signal),
    enabled: !!serviceName,
    // 새로고침 · 시간 범위 변경 때만 이전 값을 유지한다. 다른 서비스로 바꾸면 이전 서비스 데이터를 보이지 않는다
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[1] === serviceName ? prev : undefined),
  })
  // 서버가 호출 수 순으로 준다고 가정하지 않고 한 번 더 정렬한다
  const rows = [...(data?.items ?? [])].sort((a, b) => b.cnt - a.cnt).slice(0, TOP)

  return (
    <Card
      title={
        <span className="sm-card-title">
          상위 URL <span className="sm-card-sub text-caption-12">호출수 기준 {TOP}건</span>
        </span>
      }
      actions={
        serviceName ? (
          <Link className="sm-link text-caption-12-medium" to={href('/transactions', { serviceName }, { tab: 'urls' })}>
            URL 통계 전체
          </Link>
        ) : null
      }
    >
      {!serviceName ? (
        <CardNotice>{notice}</CardNotice>
      ) : isError && !data ? (
        <CardNotice>URL 통계를 불러오지 못했습니다.</CardNotice>
      ) : !data ? (
        <CardNotice>불러오는 중…</CardNotice>
      ) : rows.length === 0 ? (
        <CardNotice>이 시간 범위에 기록된 요청이 없습니다.</CardNotice>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>span_name</TableHeaderCell>
              <TableHeaderCell align="right">cnt</TableHeaderCell>
              <TableHeaderCell align="right">p95_ms</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.span_name}>
                <TableCell type="mono" className="sm-url__name" title={r.span_name}>{r.span_name}</TableCell>
                <TableCell type="number">{fmtCount(r.cnt)}</TableCell>
                <TableCell type="number" className={r.p95_ms >= SLOW_P95_MS ? 'sm-err--crit' : undefined}>
                  {fmtCount(r.p95_ms)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
