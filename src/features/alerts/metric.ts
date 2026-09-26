// 경보 값 표시 규칙 — metric_kind 별 단위 · 비교 기호 · 경과 시간. React 와 무관한 계산만 둔다
import type { MetricKind, Operator } from '@/api'

/** metric_kind → 단위. AGENT_DOWN 은 마지막 신호 뒤 흐른 초 */
export const UNIT: Record<MetricKind, string> = {
  '5XX_RATE': '%',
  '4XX_RATE': '%',
  P95_LATENCY: 'ms',
  CPU: '%',
  HEAP: '%',
  GC_TIME: 'ms',
  AGENT_DOWN: '초',
}

export const OPERATOR: Record<Operator, string> = { GT: '>', GTE: '≥', LT: '<', LTE: '≤' }

/** 1,240 · 4.2 (소수는 한 자리까지) */
export const fmtValue = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 1 })

/** 경과 시간을 사람 말로: 45초 · 12분 · 1시간 20분 · 2일 3시간 */
export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}초`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  if (h < 24) return m % 60 ? `${h}시간 ${m % 60}분` : `${h}시간`
  const d = Math.floor(h / 24)
  return h % 24 ? `${d}일 ${h % 24}시간` : `${d}일`
}
