// 플랫폼 상태 (S10 · 사이드바 파수꾼 카드).
// ⚠️ 제안 문 — 명세에 아직 없다 (api-map.md 하단 #51~#53 · review-1.md F1~F4). 백엔드 확정 뒤 필드 이름이 바뀔 수 있다.
//   #51 GET /platform/canary        — 내부 문 #4(/internal/canary/freshness)를 화면용(VIEWER+)으로 다시 연 것 + Dead Man's Switch 마지막 핑
//   #52 GET /platform/services      — API 서버가 우리 서비스 6개의 /readyz 를 대신 훑어 한 번에 준다
//   #53 GET /platform/canary/events — 파수꾼 판정 이력 (근거 표 canary_events 도 ERD 에 아직 없다)
import { api, type Page } from './client'

/** 카나리 신선도 — 가장 최근 카나리 신호가 몇 초 전에 조회 가능해졌나 (age_sec ≤ threshold_sec 면 fresh) */
export type CanaryFreshness = {
  service_name: string
  last_signal_at: string
  age_sec: number
  threshold_sec: number
  fresh: boolean
  /** 파수꾼이 Dead Man's Switch(Healthchecks.io)에 마지막으로 핑한 시각. 파수꾼 자신이 죽었는지 보는 값 */
  dms_last_ping_at?: string | null
}

export function getCanary(signal?: AbortSignal): Promise<CanaryFreshness> {
  return api.get<CanaryFreshness>('/platform/canary', { signal })
}

/** 우리 서비스 하나의 준비 상태 — /readyz 가 의존 저장소까지 닿아야 ready */
export type PlatformService = {
  service_name: string
  ready: boolean
  /** 의존 저장소 · 확인 항목 (예: PostgreSQL · Kafka) */
  deps: string[]
  pod_count: number
  checked_at: string
  /** 준비가 안 된 이유 등 짧은 메모 (예: 알림 실패 2건) */
  note?: string | null
}

export function listPlatformServices(signal?: AbortSignal): Promise<PlatformService[]> {
  return api.get<PlatformService[]>('/platform/services', { signal })
}

export type CanaryEventKind = 'FRESH' | 'STALE' | 'DMS_MISSED'

export type CanaryEvent = {
  ts: string
  kind: CanaryEventKind
  /** DMS_MISSED 는 카나리 판정이 아니라서 없다 */
  age_sec: number | null
  threshold_sec: number
  /** 파수꾼이 한 일 (예: Slack 직접 발송) */
  action: string | null
}

export function listCanaryEvents(q: { from?: string; to?: string; cursor?: string | null; limit?: number } = {}, signal?: AbortSignal): Promise<Page<CanaryEvent>> {
  return api.getPage<CanaryEvent>('/platform/canary/events', { query: q, signal })
}
