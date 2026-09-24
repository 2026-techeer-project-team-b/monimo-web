// 가짜 응답 공통 도우미 — 응답 봉투 · 데모 계정 · access 토큰. 화면별 가짜 응답 파일(mocks/<화면>.ts)이 가져다 쓴다
import { HttpResponse } from 'msw'

export const reqId = () => crypto.randomUUID()
export const ok = (data: unknown, status = 200) => HttpResponse.json({ data }, { status, headers: { 'X-Request-Id': reqId() } })
export const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status, headers: { 'X-Request-Id': reqId() } })

// ── 인증 (데모 계정, 비밀번호는 모두 monimo2026) ──
export const USERS = [
  { user_uuid: '0b0e6a6e-1f00-4c1a-9a01-000000000001', email: 'admin@monimo.io', name: '김승조', role: 'ADMIN', created_at: '2026-09-01T00:00:00Z' },
  { user_uuid: '0b0e6a6e-1f00-4c1a-9a01-000000000002', email: 'viewer@monimo.io', name: '이뷰어', role: 'VIEWER', created_at: '2026-09-01T00:00:00Z' },
] as const
export const PASSWORD = 'monimo2026'
export const ACCESS_TTL_SEC = 300

export const accessTokens = new Map<string, { userUuid: string; expiresAt: number }>()
export function issueAccess(userUuid: string) {
  const token = `mock-access.${crypto.randomUUID()}`
  accessTokens.set(token, { userUuid, expiresAt: Date.now() + ACCESS_TTL_SEC * 1000 })
  return token
}

export function currentUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  const entry = token ? accessTokens.get(token) : undefined
  if (!entry || entry.expiresAt < Date.now()) return null
  return USERS.find((u) => u.user_uuid === entry.userUuid) ?? null
}

/** 로그인이 안 됐으면 401 응답, 됐으면 null */
export const unauthenticated = (request: Request) => (currentUser(request) ? null : fail(401, 'UNAUTHENTICATED', '로그인이 필요합니다.'))
