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
