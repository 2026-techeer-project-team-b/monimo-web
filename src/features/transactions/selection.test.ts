import { describe, expect, it } from 'vitest'
import type { ScatterPoint } from '@/api'
import { pointsIn, selectedCount, toCoordRange, toSelection } from './selection'

const T0 = Date.parse('2026-09-21T00:00:00Z')
const point = (sec: number, ms: number, is_error = false): ScatterPoint =>
  ({ trace_id: `t${sec}`, start_time: new Date(T0 + sec * 1000).toISOString(), duration_ms: ms, is_error, http_status: 200, span_name: 'GET /', agent_key: 'a' }) as ScatterPoint

describe('스캐터 드래그 선택', () => {
  it('사각형을 명세 조건으로: 시각은 초 단위로 넓히고, 응답시간은 정수로 넓힌다', () => {
    const s = toSelection([
      [T0 + 1500, T0 + 400],
      [120.7, 30.2],
    ])
    expect(s).toEqual({ from: '2026-09-21T00:00:00Z', to: '2026-09-21T00:00:02Z', minMs: 30, maxMs: 121 })
    // 되돌리면 다시 그릴 수 있는 사각형이 된다
    expect(toCoordRange(s)).toEqual([
      [T0, T0 + 2000],
      [30, 121],
    ])
  })

  it('사각형 안의 점만 세고(끝 시각은 제외), 격자로 접힌 응답이면 세지 않는다', () => {
    const s = { from: new Date(T0).toISOString(), to: new Date(T0 + 10_000).toISOString(), minMs: 100, maxMs: 500 }
    const pts = [point(0, 100), point(5, 500, true), point(10, 200), point(3, 99)]
    expect(pointsIn(pts, s).map((p) => p.trace_id)).toEqual(['t0', 't5'])
    expect(selectedCount({ mode: 'raw', points: pts }, s, 'all')).toEqual({ total: 2, failed: 1 })
    expect(selectedCount({ mode: 'raw', points: pts }, s, 'fail')).toEqual({ total: 1, failed: 1 })
    expect(selectedCount({ mode: 'bucketed', points: pts }, s, 'all')).toBeNull()
  })
})
