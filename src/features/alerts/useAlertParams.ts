import { useSearchParams } from 'react-router'
import type { AlertState, Severity } from '@/api'

export type AlertTab = 'events' | 'rules' | 'channels'

const TABS: AlertTab[] = ['events', 'rules', 'channels']
const STATES: AlertState[] = ['FIRING', 'RESOLVED']
const SEVERITIES: Severity[] = ['CRITICAL', 'WARNING', 'INFO']

/**
 * 경보 화면의 주소 쿼리 — tab · state · severity · event(열린 상세) · enabled(규칙 켜짐 필터) · rule(열린 규칙 모달, uuid 또는 new).
 * 새로고침 · 링크 공유해도 그대로 열린다. severity 는 이벤트 · 규칙 탭이 같이 쓴다.
 * 바꿀 때 기록은 남기지 않는다(replace) — 뒤로가기가 탭 · 필터를 하나씩 되돌리지 않게
 */
export function useAlertParams() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t === params.get('tab')) ?? 'events'
  const state = STATES.find((s) => s === params.get('state')) ?? 'FIRING'
  const severity = SEVERITIES.find((s) => s === params.get('severity')) ?? null
  const eventId = params.get('event')
  const enabled = params.get('enabled') === 'on' ? true : params.get('enabled') === 'off' ? false : null
  const ruleId = params.get('rule')

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
    tab,
    state,
    severity,
    eventId,
    enabled,
    ruleId,
    // 탭을 바꾸면 열린 상세 · 모달은 닫는다. 기본값(events · FIRING)은 주소에서 뺀다
    setTab: (t: AlertTab) => set({ tab: t === 'events' ? null : t, event: null, rule: null }),
    setState: (s: AlertState) => set({ state: s === 'FIRING' ? null : s }),
    setSeverity: (s: Severity | null) => set({ severity: s }),
    openEvent: (id: string | null) => set({ event: id }),
    setEnabled: (v: boolean | null) => set({ enabled: v === null ? null : v ? 'on' : 'off' }),
    resetRuleFilters: () => set({ enabled: null, severity: null }),
    /** 규칙 모달 열기: uuid 면 수정(VIEWER 는 보기), 'new' 면 만들기, null 이면 닫기 */
    openRule: (id: string | null) => set({ rule: id }),
  }
}
