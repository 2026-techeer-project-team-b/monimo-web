// API 호출의 입구. 화면은 fetch 를 직접 쓰지 않고 여기 api.get/post/... 만 쓴다.
// 응답이 2xx 가 아니면 ApiError 로 던진다. 화면은 status 로 06 P6 규칙(409 CONFLICT · 503 UNAVAILABLE 배너)을 고른다.
//
// 오류 본문 모양({ code, message })은 백엔드 명세 확정 전 가정이다. 다르면 readError 한 곳만 고친다.

export const API_BASE = (import.meta.env.VITE_API_BASE || '/api/v1').replace(/\/+$/, '')

export class ApiError extends Error {
  /** HTTP 상태코드. 네트워크 실패는 0 */
  readonly status: number
  /** 백엔드 오류 코드 (예: CONFLICT). 없으면 HTTP_<status> */
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function readError(res: Response): Promise<ApiError> {
  let code = `HTTP_${res.status}`
  let message = res.statusText || '요청을 처리하지 못했습니다.'
  try {
    const body: unknown = await res.json()
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>
      if (typeof b.code === 'string') code = b.code
      if (typeof b.message === 'string') message = b.message
    }
  } catch {
    // 본문이 JSON 이 아니면 상태 줄만 쓴다
  }
  return new ApiError(res.status, code, message)
}

type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  /** 쿼리 문자열. undefined 값은 빠진다 */
  query?: Record<string, string | number | boolean | undefined>
}

async function request<T>(method: string, path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  const { query, headers, ...init } = options
  const qs = query
    ? new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : ''
  const url = `${API_BASE}${path}${qs ? `?${qs}` : ''}`

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      method,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e // TanStack Query 취소는 그대로
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결하지 못했습니다.')
  }

  if (!res.ok) throw await readError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
}
