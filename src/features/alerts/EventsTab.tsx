import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listAlertEvents, type AlertState, type Severity } from '@/api'
import {
  alertStateTone,
  Badge,
  Card,
  Chip,
  CursorPager,
  formatTime,
  Segmented,
  severityTone,
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type ChipTone,
} from '@/design-system'
import { useServiceName, useTimeWindow } from '@/stores'
import { EventDrawer } from './EventDrawer'
import { EventSummary } from './EventSummary'
import { fmtDuration, fmtValue } from './metric'
import { useAlertParams } from './useAlertParams'

const LIMIT = 50
const SEVERITIES: [Severity, ChipTone][] = [
  ['CRITICAL', 'crit'],
  ['WARNING', 'warn'],
  ['INFO', 'default'],
]

/** 「경보 이벤트」 탭 — 요약 카드 · 필터 · 이벤트 표 · 상세 드로어 */
export function EventsTab() {
  const serviceName = useServiceName()
  const { from, to } = useTimeWindow()
  // 경과 시간의 기준. 시간 창 끝(자동 새로고침마다 지금으로 바뀜)을 쓴다
  const now = Date.parse(to)
  const { state, severity, eventId, setState, setSeverity, openEvent } = useAlertParams()

  // 발화 중은 기간과 상관없이 지금 울리는 것 전부, 해소는 상단바 시간 범위 안에 발화한 것
  const range = state === 'RESOLVED' ? { from, to } : {}
  const key = JSON.stringify([serviceName, state, severity])
  const [pages, setPages] = useState<{ key: string; cursors: (string | null)[] }>({ key, cursors: [null] })
  const cursors = pages.key === key ? pages.cursors : [null]
  const cursor = cursors[cursors.length - 1]

  const list = useQuery({
    queryKey: ['alert-events', 'list', serviceName, state, severity, range, cursor, state === 'FIRING' ? now : null],
    queryFn: ({ signal }) => listAlertEvents({ serviceName, state, severity: severity ?? undefined, ...range, cursor, limit: LIMIT }, signal),
    placeholderData: keepPreviousData,
  })
  const rows = list.data?.items ?? []

  return (
    <div className="al-events">
      <EventSummary serviceName={serviceName} now={now} />

      <Card>
        <div className="al-filters" role="group" aria-label="경보 필터">
          <div className="al-field">
            <span className="text-caption-12-medium">state</span>
            <Segmented<AlertState>
              aria-label="state"
              value={state}
              onChange={setState}
              options={[
                { value: 'FIRING', label: 'FIRING' },
                { value: 'RESOLVED', label: 'RESOLVED' },
              ]}
            />
          </div>
          <div className="al-field">
            <span className="text-caption-12-medium">severity (하나 고르기)</span>
            <div className="al-chips">
              {SEVERITIES.map(([s, tone]) => (
                <Chip key={s} tone={tone} selected={severity === s} onChange={(on) => setSeverity(on ? s : null)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          <p className="al-note text-caption-12">
            서비스는 상단바에서 고릅니다. {state === 'RESOLVED' ? '해소는 상단바 시간 범위 안에 발화한 것만 봅니다.' : '발화 중은 시간 범위와 상관없이 지금 울리는 것 전부입니다.'}
          </p>
        </div>
      </Card>

      <TableCard
        title={
          <span className="al-title">
            경보 이벤트 <span className="text-mono-12 al-muted">GET /alert-events</span>
          </span>
        }
        className={list.isFetching ? 'al-table is-loading' : 'al-table'}
        summary="agent_key 가 — 인 행은 서비스 단위 규칙(5xx 비율 · p95 지연 등)이라 파드가 붙지 않는다 · observed_value 단위는 상세에서"
        pager={
          <CursorPager
            hasPrev={cursors.length > 1}
            hasNext={!!list.data?.nextCursor}
            onPrev={() => setPages({ key, cursors: cursors.slice(0, -1) })}
            onNext={() => list.data?.nextCursor && setPages({ key, cursors: [...cursors, list.data.nextCursor] })}
          />
        }
      >
        {list.isError && !list.data ? (
          <p className="al-empty text-body-13" role="alert">경보 목록을 불러오지 못했습니다.</p>
        ) : !list.data ? (
          <p className="al-empty text-body-13" role="status">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="al-empty text-body-13" role="status">{state === 'FIRING' ? '지금 울리는 경보가 없습니다.' : '이 시간 범위에 해소된 경보가 없습니다.'}</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>state</TableHeaderCell>
                <TableHeaderCell>severity</TableHeaderCell>
                <TableHeaderCell>service_name</TableHeaderCell>
                <TableHeaderCell align="right">observed_value</TableHeaderCell>
                <TableHeaderCell>fired_at</TableHeaderCell>
                <TableHeaderCell>rule_name</TableHeaderCell>
                <TableHeaderCell>agent_key</TableHeaderCell>
                <TableHeaderCell align="right">{state === 'FIRING' ? '진행' : '해소까지'}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((e) => (
                <TableRow
                  key={e.alert_event_uuid}
                  onClick={() => openEvent(e.alert_event_uuid)}
                  selected={eventId === e.alert_event_uuid}
                  aria-label={`${e.rule_name} 상세 열기`}
                >
                  <TableCell type="badge"><Badge tone={alertStateTone(e.state)}>{e.state}</Badge></TableCell>
                  <TableCell type="badge"><Badge tone={severityTone(e.severity)}>{e.severity}</Badge></TableCell>
                  <TableCell>{e.service_name}</TableCell>
                  <TableCell type="number" className={e.state === 'FIRING' ? 'al-crit' : undefined}>{fmtValue(e.observed_value)}</TableCell>
                  <TableCell type="mono">{new Date(e.fired_at).toLocaleDateString('sv-SE')} {formatTime(e.fired_at).slice(0, 8)}</TableCell>
                  <TableCell className="al-rule">{e.rule_name}</TableCell>
                  <TableCell type="mono" className="al-muted">{e.agent_key ?? '—'}</TableCell>
                  <TableCell type="number">
                    {e.resolved_at ? fmtDuration(Date.parse(e.resolved_at) - Date.parse(e.fired_at)) : fmtDuration(now - Date.parse(e.fired_at))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      <EventDrawer eventId={eventId} now={now} onClose={() => openEvent(null)} />
    </div>
  )
}
