// 서비스 · 설정 가짜 응답 (GET/POST /applications · GET/PATCH/DELETE /applications/:uuid · GET/PUT /applications/:uuid/config).
// 백엔드 구현(monimo-backend #36, 2026-09-27)에 맞췄다: 목록에는 agent_count 가 없고, 빈 표시명 · 설명은 null,
// 제외는 논리 삭제(deleted_at)라 항상 성공하고 목록 · 조회에서만 빠진다. 제외한 이름으로는 다시 등록할 수 없다.
// 설정은 서비스마다 한 줄(샘플링률 · 판번호). shop-order 는 첫 적용 때 "다른 사용자가 먼저 바꾼" 상황을 한 번 만들어
// 409 CONFIG_VERSION_CONFLICT 흐름을 볼 수 있게 한다
import { http } from 'msw'
import { API_BASE } from '../client'
import type { Application, ApplicationConfig } from '../applications'
import { AGENTS } from './agents'
import { APPLICATIONS, currentUser, fail, notAdmin, ok, okPage, unauthenticated } from './common'

const CONFIGS = new Map<string, ApplicationConfig>(
  APPLICATIONS.map((a, i) => [
    a.application_uuid,
    {
      application_config_uuid: `c0f1a000-0000-4a00-9000-00000000000${i + 1}`,
      sampling_rate: [0.05, 0.01, 0.1, 0.02, 0.05][i],
      version: [3, 7, 2, 1, 4][i],
      updated_by: i === 3 ? null : 'seungjo@monimo.io',
      updated_at: a.updated_at,
    },
  ]),
)

/** 한 번만 끼어드는 "다른 사용자" — shop-order 첫 적용 */
let raced = false

/** 제외한 서비스 uuid → 제외 시각. 줄은 남기고(이름 중복 검사에 쓰인다) 목록 · 조회에서만 뺀다 */
const DELETED = new Map<string, string>()
const live = () => APPLICATIONS.filter((a) => !DELETED.has(a.application_uuid))
const nullIfEmpty = (v: string) => v || null

/** 목록 한 줄 — agent_count 없음 */
const toListItem = (a: (typeof APPLICATIONS)[number]): Application => ({ ...a, display_name: nullIfEmpty(a.display_name), description: nullIfEmpty(a.description) })
/** 상세 — 목록 + 파드 수 */
const toApp = (a: (typeof APPLICATIONS)[number]): Application => ({ ...toListItem(a), agent_count: AGENTS.filter((x) => x.service_name === a.name).length })
const find = (id: unknown) => live().find((a) => a.application_uuid === id)
const notFound = () => fail(404, 'NOT_FOUND', '서비스를 찾을 수 없습니다.')

export const applicationsHandlers = [
  http.get(`${API_BASE}/applications`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    return okPage(live().map(toListItem), 500)
  }),

  http.get(`${API_BASE}/applications/:uuid`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const a = find(params.uuid)
    return a ? ok(toApp(a)) : notFound()
  }),

  http.post(`${API_BASE}/applications`, async ({ request }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const b = (await request.json().catch(() => null)) as { name?: unknown; display_name?: unknown; description?: unknown } | null
    const name = typeof b?.name === 'string' ? b.name.trim() : ''
    // 백엔드 구현(#36)은 글자 수만 본다. 형식(영문 소문자 · 숫자 · -)은 화면(AppModals)이 먼저 막는다
    if (!name || name.length > 100) return fail(400, 'INVALID_REQUEST', 'name 은 1자 이상 100자 이하여야 합니다.')
    const existing = APPLICATIONS.find((a) => a.name === name)
    if (existing) return fail(409, 'APPLICATION_NAME_TAKEN', DELETED.has(existing.application_uuid) ? '감시 대상에서 제외된 서비스 이름입니다.' : '이미 사용 중인 이름입니다.')
    const now = new Date().toISOString()
    const a = {
      application_uuid: crypto.randomUUID(),
      name,
      display_name: typeof b?.display_name === 'string' ? b.display_name.trim() : '',
      description: typeof b?.description === 'string' ? b.description.trim() : '',
      created_at: now,
      updated_at: now,
    }
    APPLICATIONS.push(a)
    // 설정 한 줄도 같이 생긴다 (샘플링 1 %, 1판 — 명세 POST /applications)
    CONFIGS.set(a.application_uuid, { application_config_uuid: crypto.randomUUID(), sampling_rate: 0.01, version: 1, updated_by: null, updated_at: now })
    return ok(toApp(a), 201)
  }),

  http.patch(`${API_BASE}/applications/:uuid`, async ({ request, params }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const a = find(params.uuid)
    if (!a) return notFound()
    const b = (await request.json().catch(() => null)) as { display_name?: unknown; description?: unknown } | null
    if (typeof b?.display_name === 'string') a.display_name = b.display_name.trim()
    if (typeof b?.description === 'string') a.description = b.description.trim()
    a.updated_at = new Date().toISOString()
    return ok(toApp(a))
  }),

  // 제외: 논리 삭제. 규칙 · 파드 · 이력 · 설정은 그대로 두고 목록 · 조회에서만 뺀다
  http.delete(`${API_BASE}/applications/:uuid`, ({ request, params }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const a = find(params.uuid)
    if (!a) return notFound()
    DELETED.set(a.application_uuid, new Date().toISOString())
    return ok({ application_uuid: a.application_uuid, result: 'DELETED' })
  }),

  http.get(`${API_BASE}/applications/:uuid/config`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    // 백엔드 #36 에는 설정 문이 아직 없다. 명세의 "제외하면 조회에서 빠진다"를 따라 제외한 서비스의 설정도 404 로 둔다
    const c = find(params.uuid) && CONFIGS.get(String(params.uuid))
    return c ? ok(c) : notFound()
  }),

  http.put(`${API_BASE}/applications/:uuid/config`, async ({ request, params }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const a = find(params.uuid)
    const c = CONFIGS.get(String(params.uuid))
    if (!a || !c) return notFound()
    const b = (await request.json().catch(() => null)) as { sampling_rate?: unknown; expected_version?: unknown } | null
    const rate = b?.sampling_rate
    if (typeof rate !== 'number' || !(rate >= 0 && rate <= 1)) return fail(400, 'INVALID_REQUEST', 'sampling_rate 는 0~1 사이 숫자여야 합니다.')
    if (typeof b?.expected_version !== 'number') return fail(400, 'INVALID_REQUEST', 'expected_version 이 필요합니다.')
    if (a.name === 'shop-order' && !raced) {
      raced = true
      Object.assign(c, { sampling_rate: 0.02, version: c.version + 1, updated_by: 'jihoon@monimo.io', updated_at: new Date().toISOString() })
    }
    if (b.expected_version !== c.version) return fail(409, 'CONFIG_VERSION_CONFLICT', `다른 사용자가 먼저 바꿨습니다. 현재 v${c.version}`)
    Object.assign(c, { sampling_rate: Math.round(rate * 10000) / 10000, version: c.version + 1, updated_by: currentUser(request)!.email, updated_at: new Date().toISOString() })
    return ok(c)
  }),
]
