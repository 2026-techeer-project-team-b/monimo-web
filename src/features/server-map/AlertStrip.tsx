import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { listAlertEvents } from '@/api'
import { Badge, Banner, severityTone } from '@/design-system'
import { useFilterHref, useTimeWindow } from '@/stores'

const LIMIT = 20

/** 발화 중 경보 띠 (서비스와 상관없이 전체). 울리는 경보가 없으면 그리지 않는다 */
export function AlertStrip() {
  const href = useFilterHref()
  // 시간 범위와는 상관없는 목록이지만, 자동 새로고침 때 같이 다시 부르도록 창 끝(to)을 키에 넣는다
  const { to } = useTimeWindow()
  const { data } = useQuery({
    queryKey: ['alert-events', 'FIRING', to],
    queryFn: ({ signal }) => listAlertEvents({ state: 'FIRING', limit: LIMIT }, signal),
    placeholderData: (prev) => prev,
  })
  const events = data?.items ?? []
  if (!events.length) return null

  const count = data?.nextCursor ? `${LIMIT}건 이상` : `${events.length}건`
  return (
    <Banner
      tone={events.some((e) => e.severity === 'CRITICAL') ? 'crit' : 'warn'}
      // 30초마다 다시 그려지므로 스크린리더가 매번 읽지 않게 alert 대신 이름 붙인 영역으로 둔다
      role="region"
      aria-label="발화 중 경보"
      className="sm-alerts"
      action={<Link to={href('/alerts')}>경보 보기</Link>}
    >
      <strong className="text-body-13-strong">발화 중 {count}</strong>
      <ul className="sm-alerts__list">
        {events.map((e) => (
          <li key={e.alert_event_uuid} className="sm-alerts__item">
            <Badge tone={severityTone(e.severity)}>{e.severity}</Badge>
            <span className="text-mono-12">{e.service_name}</span>
            <span className="text-caption-12">
              {e.rule_name} · 실측 {e.observed_value.toLocaleString('en-US')}
            </span>
          </li>
        ))}
      </ul>
    </Banner>
  )
}
