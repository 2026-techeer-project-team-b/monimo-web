// 서비스 · 설정 가짜 응답 (GET/POST /applications · GET/PATCH/DELETE /applications/:uuid · GET/PUT /applications/:uuid/config).
// 설정은 서비스마다 한 줄(샘플링률 · 판번호). shop-order 는 첫 적용 때 "다른 사용자가 먼저 바꾼" 상황을 한 번 만들어
// 409 CONFIG_VERSION_CONFLICT 흐름을 볼 수 있게 한다
import { http } from 'msw'
import { API_BASE } from '../client'
import type { Application, ApplicationConfig } from '../applications'
import { AGENTS } from './agents'
import { RULES } from './alerts'
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

const toApp = (a: (typeof APPLICATIONS)[number]): Application => ({ ...a, agent_count: AGENTS.filter((x) => x.service_name === a.name).length })
const find = (id: unknown) => APPLICATIONS.find((a) => a.application_uuid === id)
const notFound = () => fail(404, 'NOT_FOUND', '서비스를 찾을 수 없습니다.')

export const applicationsHandlers = [
  http.get(`${API_BASE}/applications`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    return okPage(APPLICATIONS.map(toApp), 500)
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
    if (!/^[a-z][a-z0-9-]{1,98}[a-z0-9]$/.test(name)) return fail(400, 'INVALID_REQUEST', 'name 은 영문 소문자 · 숫자 · - 로 3~100자여야 합니다.')
    if (APPLICATIONS.some((a) => a.name === name)) return fail(409, 'APPLICATION_NAME_TAKEN', '이미 사용 중인 이름입니다.')
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
    // 설정 한 줄도 같이 생긴다 (기본 샘플링 5%, 1판)
    CONFIGS.set(a.application_uuid, { application_config_uuid: crypto.randomUUID(), sampling_rate: 0.05, version: 1, updated_by: null, updated_at: now })
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

  // 제외: 딸린 규칙이 있거나 설정을 한 번이라도 바꿨으면(판번호 > 1) 409 CONFLICT
  http.delete(`${API_BASE}/applications/:uuid`, ({ request, params }) => {
    const denied = notAdmin(request)
    if (denied) return denied
    const a = find(params.uuid)
    if (!a) return notFound()
    const rules = RULES.filter((r) => r.application_uuid === a.application_uuid).length
    const changed = (CONFIGS.get(a.application_uuid)?.version ?? 1) > 1
    if (rules || changed)
      return fail(409, 'CONFLICT', [rules ? `딸린 경보 규칙 ${rules}개` : '', changed ? '바꾼 설정' : ''].filter(Boolean).join(' · ') + '이(가) 있어 제외할 수 없습니다.')
    APPLICATIONS.splice(APPLICATIONS.indexOf(a), 1)
    CONFIGS.delete(a.application_uuid)
    return ok({ application_uuid: a.application_uuid, result: 'DELETED' })
  }),

  http.get(`${API_BASE}/applications/:uuid/config`, ({ request, params }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const c = CONFIGS.get(String(params.uuid))
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
