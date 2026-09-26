// 스팬 나무 → 타임라인 행. React 와 무관한 계산만 둔다
import type { Span } from '@/api'

export const spanMs = (s: Span) => s.duration_ns / 1_000_000

export type Row = { span: Span; depth: number; hasChildren: boolean }

/** 펼친 부분만 위에서 아래로 (접힌 스팬의 자식은 뺀다). 형제는 시작 시각 순 */
export function flatten(root: Span, collapsed: ReadonlySet<string>): Row[] {
  const rows: Row[] = []
  const walk = (span: Span, depth: number) => {
    rows.push({ span, depth, hasChildren: span.children.length > 0 })
    if (collapsed.has(span.span_id)) return
    ;[...span.children].sort((a, b) => a.start_time.localeCompare(b.start_time)).forEach((c) => walk(c, depth + 1))
  }
  walk(root, 0)
  return rows
}

/** 눈금 간격: 전체를 4~5칸으로 나누는 1 · 2 · 5 × 10^n */
export function ticks(totalMs: number): number[] {
  if (totalMs <= 0) return [0]
  const raw = totalMs / 5
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let t = 0; t < totalMs - step * 0.3; t += step) out.push(t)
  return out
}

/** 2,584.0 ms · 38.2 ms */
export const fmtMs = (ms: number) => `${ms.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ms`
