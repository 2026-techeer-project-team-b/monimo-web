import { describe, expect, it } from 'vitest'
import { errorStepSec, toView } from './timeline'

describe('에러 막대', () => {
  it('막대가 90개를 넘지 않게 칸 크기를 고른다 (1시간 = 60초, 24시간 = 960초)', () => {
    expect(errorStepSec('2026-09-21T00:00:00Z', '2026-09-21T01:00:00Z')).toBe(60)
    expect(errorStepSec('2026-09-20T00:00:00Z', '2026-09-21T00:00:00Z')).toBe(960)
  })

  it('응답을 칸 · 대역별로 모으고, 합계와 예외 타입 순위를 낸다', () => {
    const v = toView(
      {
        step: 60,
        series: [
          { ts_min: '2026-09-21T00:00:00Z', http_status_class: '5xx', exception_type: 'SQLTimeoutException', cnt: 3 },
          { ts_min: '2026-09-21T00:01:00Z', http_status_class: '4xx', exception_type: null, cnt: 2 },
          { ts_min: '2026-09-21T00:01:00Z', http_status_class: '5xx', exception_type: 'SQLTimeoutException', cnt: 1 },
          // 창 밖은 버린다
          { ts_min: '2026-09-21T00:05:00Z', http_status_class: '5xx', exception_type: 'X', cnt: 9 },
        ],
      },
      '2026-09-21T00:00:00Z',
      '2026-09-21T00:03:00Z',
    )
    expect(v.xs).toHaveLength(3)
    expect(v.byClass['5xx']).toEqual([3, 1, 0])
    expect(v.byClass['4xx']).toEqual([0, 2, 0])
    expect(v.total).toBe(6)
    expect(v.types).toEqual([
      { type: 'SQLTimeoutException', cnt: 4 },
      { type: '(예외 없음)', cnt: 2 },
    ])
  })
})
