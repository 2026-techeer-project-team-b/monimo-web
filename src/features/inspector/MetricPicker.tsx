import { useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMetricNames } from '@/api'
import { Badge, Card, Input } from '@/design-system'

type Props = {
  serviceName: string
  from: string
  to: string
  /** 이미 차트가 있는 지표 (기본 4장 + 추가한 것) — 목록에서 「추가됨」 */
  shown: string[]
  onAdd: (metric: string) => void
}

/** 지표 추가 — 이 서비스에 실제로 들어온 지표 이름을 찾아 고르면 차트가 한 장 붙는다 */
export function MetricPicker({ serviceName, from, to, shown, onAdd }: Props) {
  const id = useId()
  const [q, setQ] = useState('')
  const names = useQuery({
    queryKey: ['metric-names', serviceName, from, to],
    queryFn: ({ signal }) => listMetricNames({ serviceName, from, to }, signal),
    staleTime: 60_000,
  })
  const needle = q.trim().toLowerCase()
  const rows = (names.data ?? []).filter((n) => !needle || n.metric_name.toLowerCase().includes(needle))

  return (
    <Card className="in-picker">
      <header className="in-picker__head">
        <h2 className="text-section-15">지표 추가</h2>
        <span className="text-mono-11 in-muted">GET /metrics/names · service_name={serviceName}</span>
      </header>
      <div className="in-picker__search">
        <label htmlFor={id} className="text-caption-12-medium">
          지표 이름
        </label>
        <Input id={id} type="search" placeholder="지표 이름으로 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-caption-12 in-muted">{names.data ? `${rows.length}개 · 이름을 고르면 차트 한 장이 추가됩니다` : ''}</span>
      </div>
      {names.isError && !names.data ? (
        <p className="in-empty text-body-13" role="alert">지표 이름을 불러오지 못했습니다.</p>
      ) : !names.data ? (
        <p className="in-empty text-body-13" role="status">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="in-empty text-body-13" role="status">{needle ? `"${q.trim()}" 이(가) 들어간 지표가 없습니다.` : '이 시간 범위에 들어온 지표가 없습니다.'}</p>
      ) : (
        <ul className="in-picker__list">
          {rows.map((n) => {
            const added = shown.includes(n.metric_name)
            return (
              <li key={n.metric_name}>
                <button type="button" className="in-metric" disabled={added} onClick={() => onAdd(n.metric_name)}>
                  <span className="text-mono-12-strong">{n.metric_name}</span>
                  <span className="text-caption-12 in-muted">attribute_keys — {n.attribute_keys.length ? n.attribute_keys.join(', ') : '없음'}</span>
                  {added ? <Badge tone="muted">추가됨</Badge> : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
