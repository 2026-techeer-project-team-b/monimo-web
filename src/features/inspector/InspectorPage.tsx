import { useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listAgents } from '@/api'
import { Card } from '@/design-system'
import { useServiceName, useTimeWindow } from '@/stores'
import { MetricChartCard } from './MetricChartCard'
import { MetricPicker } from './MetricPicker'
import { customMetric, DEFAULT_METRICS } from './metricView'
import { PodHeader } from './PodHeader'
import { PodList } from './PodList'
import { useInspectorParams } from './useInspectorParams'
import './Inspector.css'

/** 인스펙터 (S04) — 왼쪽 파드 목록, 오른쪽 고른 파드의 머리 · 지표 차트 · 지표 추가 */
export function InspectorPage() {
  const serviceName = useServiceName()
  const { from, to } = useTimeWindow()
  const { agentId, status, metrics, selectAgent, setStatus, addMetric, removeMetric } = useInspectorParams()

  const agents = useQuery({
    queryKey: ['agents', serviceName],
    queryFn: ({ signal }) => listAgents({ serviceName, limit: 500 }, signal),
    placeholderData: keepPreviousData,
  })
  // 서비스를 바꾼 직후 이전 서비스 목록이 남아 보이지 않게
  const list = agents.data?.items.filter((a) => !serviceName || a.service_name === serviceName)
  // 주소의 파드가 목록에 없으면(서비스를 바꿨거나 처음 열었을 때) 살아 있는 첫 파드를 보여 준다. 주소는 누를 때만 쓴다
  const selected = list?.find((a) => a.agent_uuid === agentId) ?? list?.find((a) => a.status === 'UP') ?? list?.[0]

  const custom = useMemo(() => metrics.filter((m) => !DEFAULT_METRICS.some((d) => d.metric === m)).map(customMetric), [metrics])
  const shown = [...DEFAULT_METRICS.map((d) => d.metric), ...custom.map((c) => c.metric)]

  return (
    <div className="in-page">
      <PodList
        agents={list}
        isError={agents.isError}
        status={status}
        onStatus={setStatus}
        selectedId={selected?.agent_uuid ?? null}
        onSelect={selectAgent}
        showService={!serviceName}
      />
      <div className="in-main">
        {!selected ? (
          <Card>
            <p className="in-empty text-body-13" role="status">
              {agents.data ? '왼쪽에서 파드를 고르세요.' : '파드 목록을 불러오는 중…'}
            </p>
          </Card>
        ) : (
          <>
            <PodHeader key={selected.agent_uuid} agentId={selected.agent_uuid} />
            <div className="in-charts">
              {[...DEFAULT_METRICS, ...custom].map((ui) => (
                <MetricChartCard
                  key={ui.metric}
                  ui={ui}
                  serviceName={selected.service_name}
                  agentKey={selected.agent_key}
                  from={from}
                  to={to}
                  onRemove={DEFAULT_METRICS.includes(ui) ? undefined : () => removeMetric(ui.metric)}
                />
              ))}
            </div>
            <MetricPicker serviceName={selected.service_name} from={from} to={to} shown={shown} onAdd={addMetric} />
          </>
        )}
      </div>
    </div>
  )
}
