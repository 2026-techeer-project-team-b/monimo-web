import { useSearchParams } from 'react-router'
import type { AgentStatus } from '@/api'

const STATUSES: AgentStatus[] = ['UP', 'DOWN', 'UNKNOWN']

/**
 * 인스펙터 주소 쿼리 — agent(고른 파드 uuid) · status(파드 목록 상태 칩) · m(지표 추가로 붙인 차트, 쉼표로 여러 개).
 * 새로고침 · 링크 공유해도 같은 파드 · 같은 차트가 열린다. 바꿀 때 기록은 남기지 않는다(replace)
 */
export function useInspectorParams() {
  const [params, setParams] = useSearchParams()
  const agentId = params.get('agent')
  const status = STATUSES.find((s) => s === params.get('status')) ?? null
  const metrics = (params.get('m') ?? '').split(',').filter(Boolean)

  const set = (next: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(next)) {
          if (v) p.set(k, v)
          else p.delete(k)
        }
        return p
      },
      { replace: true },
    )

  return {
    agentId,
    status,
    metrics,
    selectAgent: (id: string) => set({ agent: id }),
    setStatus: (s: AgentStatus | null) => set({ status: s }),
    addMetric: (name: string) => set({ m: [...metrics.filter((x) => x !== name), name].join(',') }),
    removeMetric: (name: string) => set({ m: metrics.filter((x) => x !== name).join(',') || null }),
  }
}
