// 에러 분석 가짜 응답 (GET /errors · GET /errors/timeline).
// 트랜잭션 가짜 요청(traces.ts) 중 실패한 것을 그대로 쓴다 — 스캐터의 빨간 점 · 트레이스 상세와 같은 요청이다.
// 상태코드 · 예외 타입 · 메시지는 failures.ts 가 정한다
import { http } from 'msw'
import { API_BASE } from '../client'
import type { ErrorSpan, ErrorTimelinePoint, HttpStatusClass } from '../errors'
import { okPage, ok, seeded, timeRange, unauthenticated } from './common'
import { failureOf } from './failures'
import { requestsIn } from './traces'

const statusClass = (s: number | null): HttpStatusClass => (s == null ? 'other' : s >= 500 ? '5xx' : s >= 400 ? '4xx' : 'other')

function errorSpans(service: string, from: number, to: number, agentKey: string | null): ErrorSpan[] {
  return requestsIn(service, from, to, agentKey)
    .filter((p) => p.is_error)
    .map((p) => {
      const f = failureOf(p.service_name, p.trace_id)
      const r = seeded(`span|${p.trace_id}`)
      return {
        trace_id: p.trace_id,
        span_id: Array.from({ length: 16 }, () => Math.floor(r() * 16).toString(16)).join(''),
        start_time: p.start_time,
        duration_ns: p.duration_ms * 1_000_000,
        service_name: p.service_name,
        agent_key: p.agent_key,
        span_name: p.span_name,
        span_kind: 'SERVER',
        status_code: 'ERROR',
        http_status: f.http_status,
        exception_type: f.exception_type,
        exception_message: f.exception_message,
      }
    })
}

export const errorsHandlers = [
  // 실패 스팬 목록: 시간 역순, 커서는 건너뛸 건수. http_status · exception_type 은 정확히 같은 값만
  http.get(`${API_BASE}/errors`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const url = new URL(request.url)
    const range = timeRange(url)
    if (range instanceof Response) return range
    const q = url.searchParams
    const status = q.get('http_status')
    const type = q.get('exception_type')
    const rows = errorSpans(q.get('service_name') ?? '', range.from, range.to, q.get('agent_key'))
      .filter((e) => (!status || String(e.http_status) === status) && (!type || e.exception_type === type))
      .sort((a, b) => b.start_time.localeCompare(a.start_time))
    const limit = Math.min(Number(q.get('limit')) || 50, 500)
    const offset = Number(q.get('cursor')) || 0
    return okPage(rows.slice(offset, offset + limit), limit, offset + limit < rows.length ? String(offset + limit) : null)
  }),

  // 시간대별 에러 건수: step 초 칸 × 상태코드 대역 × 예외 타입
  http.get(`${API_BASE}/errors/timeline`, ({ request }) => {
    const denied = unauthenticated(request)
    if (denied) return denied
    const url = new URL(request.url)
    const range = timeRange(url)
    if (range instanceof Response) return range
    const step = Math.max(60, Math.round(Number(url.searchParams.get('step')) / 60) * 60 || 60)
    const cells = new Map<string, ErrorTimelinePoint>()
    for (const e of errorSpans(url.searchParams.get('service_name') ?? '', range.from, range.to, null)) {
      const ts = Math.floor(Date.parse(e.start_time) / (step * 1000)) * step * 1000
      const cls = statusClass(e.http_status)
      const key = `${ts}|${cls}|${e.exception_type}`
      const cell = cells.get(key)
      if (cell) cell.cnt += 1
      else cells.set(key, { ts_min: new Date(ts).toISOString(), http_status_class: cls, exception_type: e.exception_type, cnt: 1 })
    }
    return ok({ step, series: [...cells.values()] })
  }),
]
