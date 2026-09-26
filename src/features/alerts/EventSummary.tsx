import { useQuery } from '@tanstack/react-query'
import { listAlertEvents, type AlertEvent } from '@/api'
import { Badge, Card } from '@/design-system'
import { toIso } from '@/stores'
import { fmtDuration } from './metric'

const DAY = 24 * 60 * 60_000

type Props = { serviceName: string | null; now: number }

/** 요약 카드 두 장 — 지금 발화 중인 경보, 최근 24시간에 해소된 경보 */
export function EventSummary({ serviceName, now }: Props) {
  // 자동 새로고침 때 같이 다시 부르도록 기준 시각(now)을 키에 넣는다
  const firing = useQuery({
    queryKey: ['alert-events', 'summary', 'FIRING', serviceName, now],
    queryFn: ({ signal }) => listAlertEvents({ serviceName, state: 'FIRING', limit: 500 }, signal),
    placeholderData: (prev) => prev,
  })
  const resolved = useQuery({
    queryKey: ['alert-events', 'summary', 'RESOLVED', serviceName, now],
    queryFn: ({ signal }) => listAlertEvents({ serviceName, state: 'RESOLVED', from: toIso(now - DAY), to: toIso(now), limit: 500 }, signal),
    placeholderData: (prev) => prev,
  })

  const f = firing.data?.items ?? []
  const r = resolved.data?.items ?? []
  const oldest = f.reduce<AlertEvent | null>((a, e) => (!a || e.fired_at < a.fired_at ? e : a), null)
  const bySeverity = (['CRITICAL', 'WARNING', 'INFO'] as const)
    .map((s) => [s, f.filter((e) => e.severity === s).length] as const)
    .filter(([, n]) => n > 0)
  const took = r.filter((e) => e.resolved_at).map((e) => Date.parse(e.resolved_at!) - Date.parse(e.fired_at))
  const avg = took.length ? took.reduce((a, b) => a + b, 0) / took.length : 0
  const max = took.length ? Math.max(...took) : 0

  return (
    <div className="al-summary">
      <Card className="al-kpi">
        <span className="text-caption-12-medium al-muted">발화 중</span>
        <div className="al-kpi__row">
          <span className={`text-number-28${f.length ? ' al-crit' : ''}`}>{firing.data ? `${f.length}${firing.data.nextCursor ? '+' : ''}` : '—'}</span>
          <span className="text-caption-12">건</span>
          <Badge tone={f.length ? 'crit' : 'muted'}>FIRING</Badge>
        </div>
        <p className="text-caption-12 al-muted">
          {oldest ? `가장 오래된 발화 ${fmtDuration(now - Date.parse(oldest.fired_at))} 전 · ` : '울리는 경보가 없습니다'}
          {bySeverity.map(([s, n]) => `${s} ${n}`).join(' · ')}
        </p>
      </Card>
      <Card className="al-kpi">
        <span className="text-caption-12-medium al-muted">최근 24시간 해소</span>
        <div className="al-kpi__row">
          <span className="text-number-28 al-ok">{resolved.data ? `${r.length}${resolved.data.nextCursor ? '+' : ''}` : '—'}</span>
          <span className="text-caption-12">건</span>
          <Badge tone="ok">RESOLVED</Badge>
        </div>
        <p className="text-caption-12 al-muted">{took.length ? `평균 해소 시간 ${fmtDuration(avg)} · 최장 ${fmtDuration(max)}` : '해소된 경보가 없습니다'}</p>
      </Card>
    </div>
  )
}
