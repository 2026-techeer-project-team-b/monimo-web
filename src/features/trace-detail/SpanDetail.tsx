import type { ReactNode } from 'react'
import type { Span } from '@/api'
import { Badge, formatTime, httpStatusTone, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/design-system'
import { fmtMs, spanMs } from './tree'

type Props = { span: Span; index: number }

/** 고른 스팬 하나의 상세 — 기본 필드 · attributes · events(예외 등) */
export function SpanDetail({ span, index }: Props) {
  const error = span.status_code === 'ERROR'
  const attrs = Object.entries(span.attributes).sort(([a], [b]) => a.localeCompare(b))
  const fields: [string, ReactNode][] = [
    ['span_id', span.span_id],
    ['service_name', span.service_name],
    ['agent_key', span.agent_key],
    ['span_kind', span.span_kind],
    ['status_code', <span key="status" className={error ? 'td-crit' : undefined}>{span.status_code}</span>],
    ['http.status_code', span.http_status == null ? '—' : <Badge key="http" tone={httpStatusTone(span.http_status)} className="text-mono-11">{span.http_status}</Badge>],
    ['duration_ns', `${span.duration_ns.toLocaleString('en-US')} (${fmtMs(spanMs(span))})`],
    ['start_time', formatTime(span.start_time)],
  ]

  return (
    <section className="td-card td-detail" aria-label="스팬 상세">
      <header className="td-card__head">
        <h3 className="text-section-15">스팬 상세</h3>
        {error ? <Badge tone="crit">ERROR</Badge> : null}
        <span className="td-detail__name text-mono-12" title={span.span_name}>{span.span_name}</span>
        <span className="td-detail__index text-caption-12 td-muted">선택된 스팬 · {index}번째</span>
      </header>

      <dl className="td-fields">
        {fields.map(([k, v]) => (
          <div key={k}>
            <dt className="text-caption-12-medium td-muted">{k}</dt>
            <dd className="text-mono-12">{v}</dd>
          </div>
        ))}
      </dl>

      <h4 className="td-subhead text-caption-12-medium">attributes</h4>
      {attrs.length === 0 ? (
        <p className="td-none text-caption-12">속성이 없습니다.</p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>키</TableHeaderCell>
              <TableHeaderCell>값</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attrs.map(([k, v]) => (
              <TableRow key={k}>
                <TableCell type="mono">{k}</TableCell>
                <TableCell type="mono" className={k.startsWith('error.') || k.startsWith('exception.') ? 'td-crit' : undefined}>{v}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h4 className="td-subhead text-caption-12-medium">events</h4>
      {span.events.length === 0 ? (
        <p className="td-none text-caption-12">이 스팬 안에서 기록된 일(예외 · 재시도 등)이 없습니다.</p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>timestamp</TableHeaderCell>
              <TableHeaderCell>name</TableHeaderCell>
              <TableHeaderCell>exception.type</TableHeaderCell>
              <TableHeaderCell>exception.message · 그 밖의 속성</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {span.events.map((e, i) => {
              const { 'exception.type': type, 'exception.message': message, ...rest } = e.attributes
              const other = Object.entries(rest).map(([k, v]) => `${k}=${v}`).join(' · ')
              const isException = e.name === 'exception'
              return (
                <TableRow key={`${e.ts}-${i}`}>
                  <TableCell type="mono">{formatTime(e.ts)}</TableCell>
                  <TableCell type="mono" className={isException ? 'td-crit' : undefined}>{e.name}</TableCell>
                  <TableCell type="mono" className={type ? 'td-crit' : undefined}>{type ?? '—'}</TableCell>
                  <TableCell type="mono">{[message, other].filter(Boolean).join(' · ') || '—'}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
