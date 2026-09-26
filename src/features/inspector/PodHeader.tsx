import { useQuery } from '@tanstack/react-query'
import { ApiError, getActiveThreads, getAgent } from '@/api'
import { AdminOnly } from '@/auth'
import { Button, Card, formatTime, podStatusTone, StatusBadge } from '@/design-system'
import { useTimeWindow } from '@/stores'

const stamp = (iso: string) => `${new Date(iso).toLocaleDateString('sv-SE')} ${formatTime(iso).slice(0, 8)}`

/** 고른 파드의 머리 — 호스트 · JVM · 버전 · 처음 본 시각, 지금 스레드 수, 스레드 덤프 요청 */
export function PodHeader({ agentId }: { agentId: string }) {
  const agent = useQuery({ queryKey: ['agent', agentId], queryFn: ({ signal }) => getAgent(agentId, signal) })
  // 스레드 수는 자주 바뀌니 파드를 볼 동안 30초마다 다시 읽는다
  const threads = useQuery({ queryKey: ['agent', agentId, 'active-threads'], queryFn: ({ signal }) => getActiveThreads(agentId, signal), refetchInterval: 30_000, retry: false })
  const a = agent.data
  // "지금" 의 기준 — 시간 창 끝(자동 새로고침마다 지금으로 바뀜)
  const { to } = useTimeWindow()

  if (!a) {
    return (
      <Card className="in-head">
        <p className="in-empty text-body-13" role={agent.isError ? 'alert' : 'status'}>
          {agent.isError ? `파드 정보를 불러오지 못했습니다.${agent.error instanceof ApiError ? ` (${agent.error.code})` : ''}` : '불러오는 중…'}
        </p>
      </Card>
    )
  }

  const fields: [string, string][] = [
    ['hostname', a.hostname],
    ['ip', a.ip],
    ['jvm_version', a.jvm_version],
    ['agent_version', a.agent_version],
    ['first_seen_at', stamp(a.first_seen_at)],
    ['updated_at', stamp(a.updated_at)],
  ]
  const t = threads.data
  // 마지막 값이 2분보다 오래됐으면 "지금" 값이 아니라고 알린다
  const stale = t ? Date.parse(to) - Date.parse(t.ts_min) > 2 * 60_000 : false

  return (
    <Card className="in-head">
      <div className="in-head__main">
        <div className="in-head__title">
          <h2 className="text-section-15 in-mono">{a.agent_key}</h2>
          <StatusBadge tone={podStatusTone(a.status)}>{a.status}</StatusBadge>
          <span className="text-mono-11 in-muted">{a.service_name} · GET /agents/{'{uuid}'}</span>
        </div>
        <dl className="in-head__fields">
          {fields.map(([k, v]) => (
            <div key={k}>
              <dt className="text-caption-12-medium">{k}</dt>
              <dd className="text-mono-12">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="in-head__threads">
        <span className="text-caption-12-medium in-muted">현재 스레드</span>
        <span className="text-number-28">{t ? t.last_v.toLocaleString('en-US') : '—'}</span>
        <span className="text-mono-11 in-muted">
          {t ? `jvm.thread.count · ts_min ${formatTime(t.ts_min).slice(0, 5)}` : threads.isError ? '신호 없음' : ''}
        </span>
        {stale ? <span className="text-caption-12 in-warn">{formatTime(t!.ts_min).slice(0, 5)} 이후 신호 없음</span> : null}
      </div>
      <AdminOnly>
        <div className="in-head__dump">
          {/* 요청 모달 · 덤프 탭은 6단계-2 에서 연결한다 */}
          <Button variant="primary" disabled title="다음 작업(6단계-2)에서 연결합니다">
            스레드 덤프 요청
          </Button>
          <span className="text-mono-11 in-muted">POST …/thread-dumps</span>
        </div>
      </AdminOnly>
    </Card>
  )
}
