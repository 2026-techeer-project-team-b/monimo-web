import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getScatter, type ScatterPoint } from '@/api'
import { Badge, Card } from '@/design-system'
import { chartColors, EChart, useOpenTrace, type ChartOption } from '@/shared'
import { useFilterHref, useTimeWindow } from '@/stores'
import { CardNotice } from './CardNotice'
import { fmtCount } from './model'

/** 미니 스캐터에 그릴 점 상한. 넘으면 서버가 격자로 접는다(mode=bucketed) */
const LIMIT = 1000

type Dot = { value: [number, number]; point: ScatterPoint }

/** 선택한 서비스의 응답시간 분포 (시각 × 응답시간, 성공 · 실패 색) */
export function ScatterCard({ serviceName, notice }: { serviceName: string | null; notice: string }) {
  const href = useFilterHref()
  const { from, to } = useTimeWindow()
  const { data, isError } = useQuery({
    queryKey: ['scatter', serviceName, from, to, LIMIT],
    queryFn: ({ signal }) => getScatter({ serviceName: serviceName!, from, to, limit: LIMIT }, signal),
    enabled: !!serviceName,
    // 새로고침 · 시간 범위 변경 때만 이전 값을 유지한다. 다른 서비스로 바꾸면 이전 서비스 데이터를 보이지 않는다
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[1] === serviceName ? prev : undefined),
  })

  // 점을 누르면 그 요청의 트레이스 상세 드로어
  const { open } = useOpenTrace()
  const onEvents = useMemo(
    () => ({
      click: (e: unknown) => {
        const point = (e as { data?: Dot }).data?.point
        if (point) open(point.trace_id)
      },
    }),
    [open],
  )

  const option = useMemo<ChartOption | null>(() => {
    if (!data) return null
    const c = chartColors()
    const ok: Dot[] = []
    const fail: Dot[] = []
    for (const p of data.points) (p.is_error ? fail : ok).push({ value: [Date.parse(p.start_time), p.duration_ms], point: p })
    return {
      grid: { left: 44, right: 12, top: 12, bottom: 28 },
      xAxis: { type: 'time', min: Date.parse(from), max: Date.parse(to) },
      yAxis: { type: 'value', name: 'ms', nameGap: 8 },
      tooltip: {
        trigger: 'item',
        formatter: (p: { data: Dot }) =>
          `${p.data.point.span_name}<br/>${fmtCount(p.data.point.duration_ms)} ms · ${p.data.point.http_status ?? '-'}`,
      },
      series: [
        { name: '성공', type: 'scatter', cursor: 'pointer', symbolSize: 5, itemStyle: { color: c.scatter.ok }, data: ok },
        { name: '실패', type: 'scatter', cursor: 'pointer', symbolSize: 5, itemStyle: { color: c.scatter.fail }, data: fail },
      ],
    }
  }, [data, from, to])

  const link = serviceName ? (
    <Link className="sm-link text-caption-12-medium" to={href('/transactions', { serviceName })}>
      트랜잭션에서 크게 보기
    </Link>
  ) : null

  return (
    <Card
      title={
        <span className="sm-card-title">
          응답시간 분포
          {serviceName && data ? <Badge tone="accent" className="text-mono-11">mode {data.mode}</Badge> : null}
        </span>
      }
      actions={link}
    >
      {!serviceName ? (
        <CardNotice>{notice}</CardNotice>
      ) : isError && !data ? (
        <CardNotice>응답시간 분포를 불러오지 못했습니다.</CardNotice>
      ) : option && data!.points.length === 0 ? (
        <CardNotice>이 시간 범위에 기록된 요청이 없습니다.</CardNotice>
      ) : option ? (
        <>
          <EChart
            option={option}
            height={200}
            onEvents={onEvents}
            aria-label={`${serviceName} 응답시간 스캐터: 요청 ${data!.points.length}개 중 실패 ${data!.points.filter((p) => p.is_error).length}개. 점을 누르면 트레이스 상세가 열립니다.`}
          />
          <div className="sm-scatter__foot text-caption-12">
            <span className="sm-scatter__legend"><i className="sm-dot sm-dot--ok" aria-hidden />성공</span>
            <span className="sm-scatter__legend"><i className="sm-dot sm-dot--fail" aria-hidden />실패 (is_error)</span>
            <span className="sm-scatter__total text-mono-12">total_count {fmtCount(data!.total_count)}</span>
          </div>
        </>
      ) : (
        <CardNotice>불러오는 중…</CardNotice>
      )}
    </Card>
  )
}
