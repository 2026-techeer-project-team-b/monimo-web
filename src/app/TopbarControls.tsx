// 상단바 우측 공통 컨트롤 (design-spec 앱 셸 · Figma Shell/Topbar 순서): 서비스 · 시간 범위 · 새로고침.
import { useEffect, useId, useState } from 'react'
import { useIsFetching, useQuery } from '@tanstack/react-query'
import { listApplications } from '@/api'
import { Button, IconRefresh, Segmented, Select } from '@/design-system'
import { RANGE_PRESETS, REFRESH_OPTIONS, useFilters, useTimeWindow, type RefreshSec } from '@/stores'
import { usePopover } from './usePopover'
import './TopbarControls.css'

export function TopbarControls() {
  return (
    <>
      <ServiceSelect />
      <TimeRangeControl />
      <RefreshControl />
    </>
  )
}

/** 서비스 선택 (GET /applications). 빈 값 = 전체 */
function ServiceSelect() {
  const id = useId()
  const serviceName = useFilters((s) => s.serviceName)
  const setServiceName = useFilters((s) => s.setServiceName)
  const { data: apps, isError } = useQuery({ queryKey: ['applications'], queryFn: listApplications, staleTime: 5 * 60_000 })

  // 주소로 들어온 서비스가 목록에 없으면 전체로
  useEffect(() => {
    if (apps && serviceName && !apps.some((a) => a.name === serviceName)) setServiceName(null)
  }, [apps, serviceName, setServiceName])

  return (
    <div className="topbar-controls__service">
      <label htmlFor={id} className="topbar-controls__caption text-caption-12">서비스</label>
      <Select id={id} value={serviceName ?? ''} onChange={(e) => setServiceName(e.target.value || null)} disabled={!apps && !isError}>
        <option value="">전체</option>
        {apps?.map((a) => (
          <option key={a.application_uuid} value={a.name}>
            {a.display_name || a.name}
          </option>
        ))}
      </Select>
    </div>
  )
}

const CUSTOM = 'custom'

/** 브라우저 시간대의 datetime-local 값 ↔ UTC ISO */
const pad = (n: number) => String(n).padStart(2, '0')
function isoToLocalInput(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const localInputToIso = (v: string) => new Date(v).toISOString().replace(/\.\d{3}Z$/, 'Z')

/** 시간 범위: 프리셋 5 개 + 사용자 지정(시작 · 끝 입력) */
function TimeRangeControl() {
  const range = useFilters((s) => s.range)
  const setRange = useFilters((s) => s.setRange)
  const window = useTimeWindow()
  const { open, setOpen, close, rootRef, triggerRef, panelRef } = usePopover<HTMLDivElement>()
  const panelId = useId()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const openCustom = () => {
    setFrom(isoToLocalInput(window.from))
    setTo(isoToLocalInput(window.to))
    setError(null)
    setOpen(true)
  }

  const apply = () => {
    if (!from || !to) return setError('시작과 끝을 모두 입력하세요')
    const f = localInputToIso(from)
    const t = localInputToIso(to)
    if (Date.parse(f) >= Date.parse(t)) return setError('시작이 끝보다 앞서야 합니다')
    setRange({ kind: 'custom', from: f, to: t })
    close()
  }

  const value = range.kind === 'preset' ? range.preset : CUSTOM
  return (
    <div className="topbar-controls__range" ref={rootRef}>
      <div ref={triggerRef}>
        <Segmented
          aria-label="시간 범위"
          value={value}
          onChange={(v) => (v === CUSTOM ? openCustom() : setRange({ kind: 'preset', preset: v }))}
          options={[...RANGE_PRESETS.map((p) => ({ value: p, label: p })), { value: CUSTOM, label: '사용자 지정' }]}
        />
      </div>
      {open ? (
        <div ref={panelRef} id={panelId} role="dialog" aria-label="사용자 지정 시간 범위" className="topbar-panel topbar-controls__custom">
          <label className="topbar-controls__field text-caption-12-medium">
            시작
            <input type="datetime-local" className="ds-input text-body-13" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="topbar-controls__field text-caption-12-medium">
            끝
            <input type="datetime-local" className="ds-input text-body-13" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </label>
          <p className="topbar-controls__hint text-caption-12">브라우저 시간 기준 · 사용자 지정 범위에서는 자동 새로고침이 멈춥니다</p>
          {error ? <p role="alert" className="topbar-controls__error text-caption-12">{error}</p> : null}
          <div className="topbar-controls__actions">
            <Button onClick={close}>취소</Button>
            <Button variant="primary" onClick={apply}>적용</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const refreshLabel = (sec: number) => (sec === 0 ? '끔' : sec < 60 ? `${sec}s` : `${sec / 60}m`)

/** 새로고침: 아이콘 + 주기. 누르면 '지금 새로고침' · 주기 선택 */
function RefreshControl() {
  const refreshSec = useFilters((s) => s.refreshSec)
  const live = useFilters((s) => s.range.kind === 'preset')
  const setRefreshSec = useFilters((s) => s.setRefreshSec)
  const refreshNow = useFilters((s) => s.refreshNow)
  const fetching = useIsFetching() > 0
  const { open, toggle, close, rootRef, triggerRef, panelRef } = usePopover()
  const panelId = useId()
  const label = live ? refreshLabel(refreshSec) : '고정'

  return (
    <div className="topbar-controls__refresh" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="topbar-controls__refresh-btn"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`새로고침 · 자동 ${live ? refreshLabel(refreshSec) : '끔(사용자 지정 범위)'}`}
        onClick={toggle}
      >
        <IconRefresh className={fetching ? 'topbar-controls__spin' : undefined} />
        <span className="text-mono-12">{label}</span>
      </button>
      {open ? (
        <div ref={panelRef} id={panelId} className="topbar-panel topbar-controls__refresh-panel">
          <Button
            icon={<IconRefresh />}
            onClick={() => {
              refreshNow()
              close()
            }}
          >
            지금 새로고침
          </Button>
          <div className="topbar-controls__field text-caption-12-medium">
            자동 새로고침
            <Segmented
              aria-label="자동 새로고침 주기"
              value={String(refreshSec)}
              onChange={(v) => setRefreshSec(Number(v) as RefreshSec)}
              options={REFRESH_OPTIONS.map((s) => ({ value: String(s), label: refreshLabel(s) }))}
            />
          </div>
          {!live ? <p className="topbar-controls__hint text-caption-12">사용자 지정 범위에서는 자동 새로고침이 멈춥니다</p> : null}
        </div>
      ) : null}
    </div>
  )
}
