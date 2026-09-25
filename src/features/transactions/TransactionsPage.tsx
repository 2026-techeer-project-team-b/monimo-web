import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getScatter, listAgents } from '@/api'
import { Card } from '@/design-system'
import { useServiceName, useTimeWindow } from '@/stores'
import { ScatterPanel } from './ScatterPanel'
import { selectedCount, type ResultFilter, type Selection } from './selection'
import { TransactionTable } from './TransactionTable'
import './Transactions.css'

/** 스캐터에 그릴 점 상한. 넘으면 서버가 격자로 접는다(mode=bucketed) */
const SCATTER_LIMIT = 5000

/** 트랜잭션 (S02) — 응답시간 스캐터에서 드래그로 긁은 영역의 요청 목록 */
export function TransactionsPage() {
  const serviceName = useServiceName()
  if (!serviceName) {
    return (
      <Card title="서비스를 골라 주세요">
        <p className="tx-empty text-body-13">트랜잭션은 서비스 하나씩 봅니다. 상단바에서 서비스를 고르면 응답시간 분포가 나옵니다.</p>
      </Card>
    )
  }
  // 서비스가 바뀌면 필터 · 선택을 처음부터
  return <ServiceTransactions key={serviceName} serviceName={serviceName} />
}

function ServiceTransactions({ serviceName }: { serviceName: string }) {
  const { from, to } = useTimeWindow()
  const [agentKey, setAgentKey] = useState('')
  const [result, setResult] = useState<ResultFilter>('all')
  const [selection, setSelection] = useState<Selection | null>(null)

  const agents = useQuery({
    queryKey: ['agents', serviceName],
    queryFn: ({ signal }) => listAgents({ serviceName, limit: 500 }, signal),
    staleTime: 5 * 60_000,
  })
  const scatter = useQuery({
    queryKey: ['scatter', serviceName, from, to, agentKey, SCATTER_LIMIT],
    queryFn: ({ signal }) => getScatter({ serviceName, from, to, agentKey: agentKey || undefined, limit: SCATTER_LIMIT }, signal),
    placeholderData: keepPreviousData,
  })

  // 선택 건수 — 스캐터 머리말과 목록 제목이 같은 값을 쓴다
  const count = useMemo(() => selectedCount(scatter.data, selection, result), [scatter.data, selection, result])

  return (
    <div className="tx-page">
      <ScatterPanel
        scatter={scatter.data}
        isError={scatter.isError}
        from={from}
        to={to}
        agents={agents.data?.items ?? []}
        agentKey={agentKey}
        onAgentKey={setAgentKey}
        result={result}
        onResult={setResult}
        selection={selection}
        count={count}
        onSelection={setSelection}
      />
      <TransactionTable serviceName={serviceName} selection={selection} agentKey={agentKey} result={result} count={count?.total ?? null} />
    </div>
  )
}
