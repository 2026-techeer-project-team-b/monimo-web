// 인스펙터 지표 표시 규칙 — 지표 이름별 제목 · 단위 변환 · 차트 모양. React 와 무관한 계산만 둔다
import type { MetricPoint, MetricSeries } from '@/api'

export type ChartKind =
  /** avg 선 + min–max 띠 */
  | 'band'
  /** avg 선 + max 점선 */
  | 'maxline'
  /** 막대, 기준(limit) 넘으면 경고색 */
  | 'bars'

export type MetricUi = {
  metric: string
  title: string
  unit: string
  /** 서버 값(OTel 원래 단위) → 화면 단위 */
  scale: (v: number) => number
  kind: ChartKind
  /** bars 의 경고 기준 (화면 단위) */
  limit?: number
  /** 값 표시 소수 자리 */
  digits: number
}

const MB = 1024 * 1024

/** 시안의 기본 차트 4장 */
export const DEFAULT_METRICS: MetricUi[] = [
  { metric: 'jvm.cpu.recent_utilization', title: 'CPU 사용률', unit: '%', scale: (v) => v * 100, kind: 'band', digits: 1 },
  { metric: 'jvm.memory.used{heap}', title: '힙 메모리', unit: 'MB', scale: (v) => v / MB, kind: 'maxline', digits: 0 },
  { metric: 'jvm.gc.duration', title: 'GC 시간', unit: 'ms / 분', scale: (v) => v, kind: 'bars', limit: 80, digits: 0 },
  { metric: 'jvm.thread.count', title: '스레드 수', unit: '개', scale: (v) => v, kind: 'band', digits: 0 },
]

/** 지표 추가로 붙인 차트 — 이름으로 단위를 짐작한다 (OTel 이름 규칙: utilization 은 0~1 비율, memory 는 바이트, duration 은 ms) */
export function customMetric(metric: string): MetricUi {
  if (/utilization/.test(metric)) return { metric, title: metric, unit: '%', scale: (v) => v * 100, kind: 'band', digits: 1 }
  if (/memory/.test(metric)) return { metric, title: metric, unit: 'MB', scale: (v) => v / MB, kind: 'band', digits: 1 }
  if (/duration/.test(metric)) return { metric, title: metric, unit: 'ms', scale: (v) => v, kind: 'band', digits: 0 }
  return { metric, title: metric, unit: '', scale: (v) => v, kind: 'band', digits: 0 }
}

export const fmtMetric = (v: number, digits: number) => v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** 한 줄(속성 조합)의 이름: 속성이 없으면 agent_key, 있으면 값들 (예: HikariPool-1 · used) */
export const lineName = (attributes: Record<string, string>) => Object.values(attributes).join(' · ')

/** 화면 단위로 바꾼 점 */
export type ViewPoint = { t: number; avg: number; min: number; max: number; last: number }

export type ViewLine = { name: string; points: ViewPoint[] }

export function toView(s: MetricSeries, ui: MetricUi): ViewLine[] {
  const conv = (p: MetricPoint): ViewPoint => ({
    t: Date.parse(p.ts_min),
    avg: ui.scale(p.avg_v),
    min: ui.scale(p.min_v),
    max: ui.scale(p.max_v),
    last: ui.scale(p.last_v),
  })
  return s.series.map((l) => ({ name: lineName(l.attributes) || l.agent_key, points: l.points.map(conv) }))
}

/** 오른쪽 「현재」 값 — 첫 줄 마지막 점의 last_v. 신호가 없으면 null */
export const currentOf = (lines: ViewLine[]) => lines[0]?.points.at(-1)?.last ?? null
