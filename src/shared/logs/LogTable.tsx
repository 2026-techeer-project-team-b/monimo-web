import { Fragment, useState } from 'react'
import type { LogLevel, LogLine } from '@/api'
import {
  Badge,
  formatTime,
  IconChevronDown,
  IconChevronRight,
  shortId,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type Tone,
} from '@/design-system'
import { useOpenTrace } from '../trace'
import './LogTable.css'

const LEVEL_TONE: Record<LogLevel, Tone> = { ERROR: 'crit', WARN: 'warn', INFO: 'accent', DEBUG: 'muted', TRACE: 'muted' }

/** 본문에서 검색어를 찾아 <mark> 로 감싼다 (대소문자 무시) */
function highlight(text: string, q: string) {
  const needle = q.trim()
  if (!needle) return text
  const parts: (string | { hit: string })[] = []
  const lower = text.toLowerCase()
  const n = needle.toLowerCase()
  let at = 0
  for (let i = lower.indexOf(n); i !== -1; i = lower.indexOf(n, at)) {
    if (i > at) parts.push(text.slice(at, i))
    parts.push({ hit: text.slice(i, i + needle.length) })
    at = i + needle.length
  }
  if (at < text.length) parts.push(text.slice(at))
  return parts.map((p, i) => (typeof p === 'string' ? <Fragment key={i}>{p}</Fragment> : <mark key={i} className="log-mark">{p.hit}</mark>))
}

type Props = {
  rows: LogLine[]
  /** 본문 검색어 — 결과에서 노란색으로 강조 */
  q?: string
  /** 한 서비스만 보는 곳(연결 로그 등)은 service_name 칸을 빼도 된다 */
  hideService?: boolean
  /** trace_id 칸을 뺀다 (트레이스 드로어 안처럼 이미 그 트레이스를 보고 있을 때) */
  hideTrace?: boolean
}

/**
 * 로그 결과 표 (로그 검색 화면 · 트레이스 드로어의 연결 로그 공용).
 * 행 왼쪽 ▸ 를 누르면 attributes(MDC) · span_id 를 펼쳐 본다. trace_id 를 누르면 트레이스 상세 드로어가 열린다
 */
export function LogTable({ rows, q = '', hideService, hideTrace }: Props) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const { open: openTrace } = useOpenTrace()
  const keyOf = (l: LogLine, i: number) => `${l.ts}|${l.span_id}|${i}`
  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  const cols = 7 - (hideService ? 1 : 0) - (hideTrace ? 1 : 0) + 1

  return (
    <Table className="log-table">
      <TableHead>
        <TableRow>
          <TableHeaderCell>ts</TableHeaderCell>
          <TableHeaderCell>level</TableHeaderCell>
          {hideService ? null : <TableHeaderCell>service_name</TableHeaderCell>}
          <TableHeaderCell>agent_key</TableHeaderCell>
          <TableHeaderCell>logger</TableHeaderCell>
          <TableHeaderCell>thread</TableHeaderCell>
          <TableHeaderCell>message</TableHeaderCell>
          {hideTrace ? null : <TableHeaderCell>trace_id</TableHeaderCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((l, i) => {
          const k = keyOf(l, i)
          const expanded = open.has(k)
          const attrs = Object.entries(l.attributes)
          return (
            <Fragment key={k}>
              <TableRow selected={expanded}>
                <TableCell type="mono">
                  <span className="log-ts">
                    <button
                      type="button"
                      className="log-toggle"
                      aria-expanded={expanded}
                      aria-label={`${formatTime(l.ts)} 로그 ${expanded ? '접기' : '펼치기'}`}
                      onClick={() => toggle(k)}
                    >
                      {expanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                    </button>
                    {formatTime(l.ts)}
                  </span>
                </TableCell>
                <TableCell type="badge">
                  <Badge tone={LEVEL_TONE[l.level] ?? 'muted'} className="text-mono-11">{l.level}</Badge>
                </TableCell>
                {hideService ? null : <TableCell>{l.service_name}</TableCell>}
                <TableCell type="mono" className="log-clip" title={l.agent_key}>{l.agent_key}</TableCell>
                <TableCell type="mono" className="log-clip" title={l.logger}>{l.logger}</TableCell>
                <TableCell type="mono" className="log-clip log-muted" title={l.thread}>{l.thread}</TableCell>
                <TableCell className="log-message" title={l.message}>{highlight(l.message, q)}</TableCell>
                {hideTrace ? null : (
                  <TableCell type="mono">
                    {l.trace_id ? (
                      <button type="button" className="log-trace" onClick={() => openTrace(l.trace_id)} title={`${l.trace_id} 트레이스 열기`}>
                        {shortId(l.trace_id)}
                      </button>
                    ) : (
                      <span className="log-muted">—</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
              {expanded ? (
                <tr className="log-detail">
                  <td colSpan={cols}>
                    <div className="log-detail__box">
                      <span className="text-caption-12-medium">attributes</span>
                      <code className="text-mono-11">
                        {attrs.length ? `{ ${attrs.map(([a, v]) => `"${a}": ${JSON.stringify(v)}`).join(', ')} }` : '(없음)'}
                      </code>
                      <span className="log-detail__span text-mono-11 log-muted">span_id {l.span_id ? shortId(l.span_id) : '—'}</span>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}
