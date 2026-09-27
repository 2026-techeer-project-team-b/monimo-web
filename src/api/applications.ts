// 감시 대상 서비스 (api-spec 18번 GET /applications, VIEWER+)
import { api } from './client'

export type Application = {
  application_uuid: string
  /** 명세의 service_name 과 같은 글자. 바뀌지 않는다 */
  name: string
  display_name: string
  description?: string
  agent_count?: number
  created_at?: string
  updated_at?: string
}

/** 서비스 전체 (상한 5~6개라 한 쪽이면 다 온다) */
export async function listApplications(): Promise<Application[]> {
  const page = await api.getPage<Application>('/applications', { query: { limit: 500 } })
  return page.items
}

export function getApplication(uuid: string, signal?: AbortSignal): Promise<Application> {
  return api.get<Application>(`/applications/${encodeURIComponent(uuid)}`, { signal })
}

/** 등록(13번). name 은 수집기가 받는 otel.service.name 과 같은 글자여야 하고, 겹치면 409 APPLICATION_NAME_TAKEN */
export function createApplication(body: { name: string; display_name: string; description: string }): Promise<Application> {
  return api.post<Application>('/applications', body)
}

/** 표시명 · 설명만 고친다(8번). name 은 모든 신호의 열쇠라 바꿀 수 없다 */
export function updateApplication(uuid: string, body: { display_name: string; description: string }): Promise<Application> {
  return api.patch<Application>(`/applications/${encodeURIComponent(uuid)}`, body)
}

/** 감시 대상에서 제외(38번). 딸린 규칙 · 설정이 있으면 409 CONFLICT */
export function deleteApplication(uuid: string): Promise<{ application_uuid: string; result: 'DELETED' }> {
  return api.delete(`/applications/${encodeURIComponent(uuid)}`)
}

/** 서비스 설정(29 · 39번) — 샘플링률(0~1)과 판번호. 고칠 때마다 version +1 */
export type ApplicationConfig = {
  application_config_uuid: string
  /** 0.0100 = 100건 중 1건만 트레이스로 남긴다 */
  sampling_rate: number
  version: number
  /** 마지막으로 고친 사람 메일. 처음 만든 뒤 아무도 안 고쳤으면 null */
  updated_by: string | null
  updated_at: string
}

export function getApplicationConfig(uuid: string, signal?: AbortSignal): Promise<ApplicationConfig> {
  return api.get<ApplicationConfig>(`/applications/${encodeURIComponent(uuid)}/config`, { signal })
}

/** 낙관적 잠금: 내가 본 판번호(expected_version)가 아직 최신일 때만 바뀐다. 아니면 409 CONFIG_VERSION_CONFLICT */
export function putApplicationConfig(uuid: string, body: { sampling_rate: number; expected_version: number }): Promise<ApplicationConfig> {
  return api.put<ApplicationConfig>(`/applications/${encodeURIComponent(uuid)}/config`, body)
}
