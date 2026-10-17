import { describe, expect, it } from 'vitest'
import { currentOf, customMetric, DEFAULT_METRICS, toView } from './metricView'

describe('지표 단위', () => {
  it('OTel 원래 단위를 화면 단위로 바꾼다 (비율 → %, 바이트 → MB)', () => {
    const cpu = DEFAULT_METRICS.find((m) => m.metric === 'jvm.cpu.recent_utilization')!
    const heap = DEFAULT_METRICS.find((m) => m.metric === 'jvm.memory.used{heap}')!
    expect(cpu.scale(0.372)).toBeCloseTo(37.2)
    expect(heap.scale(1312 * 1024 * 1024)).toBe(1312)
  })

  it('지표 추가로 붙인 차트는 이름으로 단위를 짐작한다', () => {
    expect(customMetric('process.cpu.utilization').unit).toBe('%')
    expect(customMetric('jvm.buffer.memory.usage').unit).toBe('MB')
    expect(customMetric('http.server.request.duration').unit).toBe('ms')
    expect(customMetric('jvm.class.count').unit).toBe('')
  })

  it('속성 조합마다 한 줄, "현재" 는 첫 줄 마지막 점의 last_v', () => {
    const ui = customMetric('db.client.connections.usage')
    const lines = toView(
      {
        metric_name: ui.metric,
        source_table: 'metrics_1m',
        step: 60,
        series: [
          { agent_key: 'a', attributes: { 'pool.name': 'HikariPool-1', state: 'used' }, points: [{ ts_min: '2026-09-21T00:00:00Z', avg_v: 6, min_v: 5, max_v: 7, last_v: 6 }, { ts_min: '2026-09-21T00:01:00Z', avg_v: 8, min_v: 7, max_v: 9, last_v: 9 }] },
          { agent_key: 'a', attributes: { 'pool.name': 'HikariPool-1', state: 'idle' }, points: [] },
        ],
      },
      ui,
    )
    expect(lines.map((l) => l.name)).toEqual(['HikariPool-1 · used', 'HikariPool-1 · idle'])
    expect(currentOf(lines)).toBe(9)
    expect(currentOf([])).toBeNull()
  })

  it('힙 카드는 jvm.memory.used 를 묻고 type=heap 줄만 풀 이름으로 그리며 "현재" 는 풀 합', () => {
    const heap = DEFAULT_METRICS.find((m) => m.metric === 'jvm.memory.used{heap}')!
    expect(heap.query).toBe('jvm.memory.used')
    const MB = 1024 * 1024
    const pt = (last: number) => [{ ts_min: '2026-10-17T00:00:00Z', avg_v: last * MB, min_v: last * MB, max_v: last * MB, last_v: last * MB }]
    const lines = toView(
      {
        metric_name: 'jvm.memory.used',
        source_table: 'metrics_1m',
        step: 60,
        series: [
          { agent_key: 'a', attributes: { 'jvm.memory.pool.name': 'Metaspace', 'jvm.memory.type': 'non_heap' }, points: pt(90) },
          { agent_key: 'a', attributes: { 'jvm.memory.pool.name': 'G1 Old Gen', 'jvm.memory.type': 'heap' }, points: pt(48) },
          { agent_key: 'a', attributes: { 'jvm.memory.pool.name': 'G1 Eden Space', 'jvm.memory.type': 'heap' }, points: pt(32) },
          { agent_key: 'a', attributes: { 'jvm.memory.pool.name': 'G1 Survivor Space', 'jvm.memory.type': 'heap' }, points: [] },
        ],
      },
      heap,
    )
    expect(lines.map((l) => l.name)).toEqual(['G1 Eden Space', 'G1 Old Gen', 'G1 Survivor Space'])
    expect(currentOf(lines, heap.total)).toBe(80)
    expect(currentOf([], true)).toBeNull()
  })
})
