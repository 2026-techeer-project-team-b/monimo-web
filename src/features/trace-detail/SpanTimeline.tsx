import { useState } from 'react'
import type { Span } from '@/api'
import { IconAlertCircle, IconChevronDown, IconChevronRight, serviceColor } from '@/design-system'
import { flatten, fmtMs, spanMs, ticks } from './tree'

type Props = {
  root: Span
  /** 서비스 이름 → 서비스 팔레트 순번 (서버맵과 같은 색) */
  colorIndex: (service: string) => number
}

/** 간트형 스팬 트리 — 왼쪽은 들여쓴 나무(접기 · 펼치기), 오른쪽은 루트 기준 시작 위치 · 길이 막대 */
export function SpanTimeline({ root, colorIndex }: Props) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const rootStart = Date.parse(root.start_time)
  const total = spanMs(root)
  const pct = (ms: number) => `${Math.min(100, Math.max(0, (ms / total) * 100))}%`
  const rows = flatten(root, collapsed)

  return (
    <div className="td-timeline">
      <div className="td-timeline__head text-caption-12-medium">
        <span>span_name · service_name · agent_key</span>
        <div className="td-axis text-mono-11" aria-hidden>
          {ticks(total).map((t) => (
            <span key={t} style={{ left: pct(t) }}>{Math.round(t).toLocaleString('en-US')}</span>
          ))}
          <span className="td-axis__end">{fmtMs(total)}</span>
        </div>
      </div>
      <ul className="td-rows">
        {rows.map(({ span, depth, hasChildren }) => {
          const error = span.status_code === 'ERROR'
          const open = !collapsed.has(span.span_id)
          const offset = Date.parse(span.start_time) - rootStart
          const width = (spanMs(span) / total) * 100
          const color = serviceColor(colorIndex(span.service_name))
          return (
            <li key={span.span_id} className={`td-row${error ? ' is-error' : ''}`}>
              <div className="td-row__name" style={{ paddingLeft: depth * 14 }}>
                {hasChildren ? (
                  <button
                    type="button"
                    className="td-toggle"
                    aria-expanded={open}
                    aria-label={`${span.span_name} ${open ? '접기' : '펼치기'}`}
                    onClick={() => toggle(span.span_id)}
                  >
                    {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </button>
                ) : (
                  <span className="td-toggle" aria-hidden />
                )}
                <i className="td-dot" style={{ background: color }} aria-hidden />
                <span className={`td-row__span ${span.span_kind === 'CLIENT' && span.span_name.startsWith('JDBC') ? 'text-mono-12' : 'text-body-13'}`} title={span.span_name}>
                  {span.span_name}
                </span>
                <span className="td-row__agent text-mono-11" title={`${span.service_name} · ${span.agent_key}`}>{span.agent_key}</span>
              </div>
              <div className="td-row__bar">
                <span
                  className="td-bar"
                  style={{ left: pct(offset), width: `max(3px, ${Math.min(100, width)}%)`, background: error ? 'var(--color-status-crit)' : color }}
                >
                  {width > 14 ? <span className="td-bar__label td-bar__label--in text-mono-11">{fmtMs(spanMs(span))}</span> : null}
                </span>
                {width <= 14 ? (
                  <span className="td-bar__label text-mono-11" style={{ left: `calc(${pct(offset + spanMs(span))} + 6px)` }}>
                    {fmtMs(spanMs(span))}
                  </span>
                ) : null}
                {error ? (
                  <span className="td-bar__err" style={{ left: `calc(${pct(offset)} - 16px)` }} aria-label="에러 스팬">
                    <IconAlertCircle size={13} />
                  </span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
