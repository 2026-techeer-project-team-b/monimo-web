import { useState, type FormEvent } from 'react'
import type { Agent } from '@/api'
import { Button, Card, Input, Select } from '@/design-system'
import type { ErrorFilters } from './useErrorFilters'

const STATUSES = [400, 401, 403, 404, 409, 422, 500, 502, 503, 504]

type Props = { filters: ErrorFilters; agents: Agent[]; onApply: (f: ErrorFilters) => void }

/** 실패 스팬 표 필터. 고른 값은 「검색」을 눌러야 걸린다 (예외 타입을 치는 도중에 매번 부르지 않게) */
export function ErrorFilterBar({ filters, agents, onApply }: Props) {
  // 주소의 필터가 바뀌면(예외 타입 클릭 · 초기화) 입력칸도 따라가게, 주소 값을 key 로 다시 만든다
  return <Form key={JSON.stringify(filters)} filters={filters} agents={agents} onApply={onApply} />
}

function Form({ filters, agents, onApply }: Props) {
  const [draft, setDraft] = useState(filters)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onApply({ ...draft, exceptionType: draft.exceptionType.trim() })
  }
  return (
    <Card>
      <form className="er-filters" onSubmit={submit} aria-label="실패 스팬 필터">
        <label className="er-field">
          <span className="text-caption-12-medium">agent_key</span>
          <Select value={draft.agentKey} onChange={(e) => setDraft({ ...draft, agentKey: e.target.value })}>
            <option value="">전체</option>
            {agents.map((a) => (
              <option key={a.agent_uuid} value={a.agent_key}>{a.agent_key}</option>
            ))}
          </Select>
        </label>
        <label className="er-field">
          <span className="text-caption-12-medium">http_status</span>
          <Select value={draft.httpStatus} onChange={(e) => setDraft({ ...draft, httpStatus: e.target.value })}>
            <option value="">전체</option>
            {STATUSES.map((s) => (
              <option key={s} value={String(s)}>{s}</option>
            ))}
          </Select>
        </label>
        <label className="er-field er-field--grow">
          <span className="text-caption-12-medium">exception_type (정확한 이름)</span>
          <Input
            value={draft.exceptionType}
            placeholder="예: SQLTimeoutException"
            onChange={(e) => setDraft({ ...draft, exceptionType: e.target.value })}
          />
        </label>
        <div className="er-actions">
          <Button type="submit" variant="primary">검색</Button>
          <Button onClick={() => onApply({ agentKey: '', httpStatus: '', exceptionType: '' })}>초기화</Button>
        </div>
      </form>
    </Card>
  )
}
