import type { Agent, AgentStatus } from '@/api'
import { Card, Chip, podStatusTone, StatusDot } from '@/design-system'

type Props = {
  /** 상태 칩 숫자를 세려고 거르기 전 전체 */
  agents: Agent[] | undefined
  isError: boolean
  status: AgentStatus | null
  onStatus: (s: AgentStatus | null) => void
  selectedId: string | null
  onSelect: (id: string) => void
  /** 서비스를 고르지 않았으면 파드 이름 아래에 서비스도 적는다 */
  showService: boolean
}

const STATUSES: AgentStatus[] = ['UP', 'DOWN', 'UNKNOWN']

/** 왼쪽 파드 목록 — 상태 칩으로 거르고, 누르면 오른쪽이 그 파드로 바뀐다 */
export function PodList({ agents, isError, status, onStatus, selectedId, onSelect, showService }: Props) {
  const count = (s: AgentStatus) => agents?.filter((a) => a.status === s).length ?? 0
  const rows = agents?.filter((a) => !status || a.status === status) ?? []

  return (
    <Card className="in-pods">
      <header className="in-pods__head">
        <h2 className="text-section-15">파드 목록</h2>
        <span className="text-mono-12 in-muted">{agents ? agents.length : ''}</span>
      </header>
      <span className="text-mono-11 in-muted">GET /agents</span>
      <div className="in-pods__chips" role="group" aria-label="파드 상태">
        <Chip selected={status === null} onChange={() => onStatus(null)}>전체 {agents?.length ?? ''}</Chip>
        {STATUSES.map((s) =>
          count(s) || status === s ? (
            <Chip key={s} selected={status === s} tone={s === 'UP' ? 'ok' : s === 'DOWN' ? 'crit' : 'default'} onChange={(on) => onStatus(on ? s : null)}>
              {s} {count(s)}
            </Chip>
          ) : null,
        )}
      </div>
      {isError && !agents ? (
        <p className="in-empty text-body-13" role="alert">파드 목록을 불러오지 못했습니다.</p>
      ) : !agents ? (
        <p className="in-empty text-body-13" role="status">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="in-empty text-body-13" role="status">{agents.length ? '이 상태의 파드가 없습니다.' : '이 서비스에 등록된 파드가 없습니다.'}</p>
      ) : (
        <ul className="in-pods__list" aria-label="파드">
          {rows.map((a) => (
            <li key={a.agent_uuid}>
              <button
                type="button"
                className={a.agent_uuid === selectedId ? 'in-pod is-selected' : 'in-pod'}
                aria-current={a.agent_uuid === selectedId ? 'true' : undefined}
                onClick={() => onSelect(a.agent_uuid)}
              >
                <StatusDot tone={podStatusTone(a.status)} />
                <span className="in-pod__text">
                  <span className="text-mono-12-strong">{a.agent_key}</span>
                  <span className="text-caption-12 in-muted">
                    {showService ? `${a.service_name} · ` : ''}
                    {a.hostname}
                    {a.status === 'UP' ? '' : ` · ${a.status}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
