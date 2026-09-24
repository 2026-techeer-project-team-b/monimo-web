// 디자인 시스템 미리보기 전용: 06 P5 차트 규약이 공용 틀(EChart)로 그려지는지 눈으로 확인한다.
// 데이터는 고정 난수라 새로고침해도 같은 모양이다.
import { useMemo } from 'react'
import { Card, PageGrid, PageGridItem } from '@/design-system'
import { chartColors, EChart, heatmapStep, heatmapVisualMap, type ChartOption } from '@/shared'

/** 고정 씨앗 난수 (미리보기 모양이 매번 같게) */
function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

const T0 = Date.UTC(2026, 8, 24, 5, 0, 0) // 14:00 KST
const MIN = 60_000

export function ChartPreview() {
  const scatter = useMemo<ChartOption>(() => {
    const c = chartColors()
    const r = rng(7)
    const ok: [number, number][] = []
    const fail: [number, number][] = []
    for (let i = 0; i < 400; i++) {
      const t = T0 + r() * 60 * MIN
      const ms = r() < 0.9 ? 40 + r() * 400 : 800 + r() * 1200
      ;(r() < 0.06 ? fail : ok).push([t, Math.round(ms)])
    }
    return {
      xAxis: { type: 'time' },
      yAxis: { type: 'value', name: 'ms' },
      tooltip: { trigger: 'item' },
      series: [
        { name: '성공', type: 'scatter', symbolSize: 5, itemStyle: { color: c.scatter.ok }, data: ok },
        { name: '실패', type: 'scatter', symbolSize: 5, itemStyle: { color: c.scatter.fail }, data: fail },
      ],
    }
  }, [])

  const heatmap = useMemo<ChartOption>(() => {
    const r = rng(11)
    const cols = 24
    const rows = 5
    const cells: [number, number, number][] = []
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) cells.push([x, y, Math.max(0, Math.round((rows - y) * 12 * r()))])
    const max = Math.max(...cells.map((d) => d[2]))
    const errors = new Set(['5-3', '17-3', '18-4'])
    return {
      xAxis: { type: 'category', data: Array.from({ length: cols }, (_, i) => `14:${String(i * 2.5 | 0).padStart(2, '0')}`), splitLine: { show: false } },
      yAxis: { type: 'category', data: ['0.1s', '0.5s', '1s', '2s', '5s'], splitLine: { show: false } },
      tooltip: { trigger: 'item' },
      visualMap: heatmapVisualMap(),
      series: [{ type: 'heatmap', data: cells.map(([x, y, v]) => [x, y, v, heatmapStep(v, max, errors.has(`${x}-${y}`))]) }],
    }
  }, [])

  const line = useMemo<ChartOption>(() => {
    const c = chartColors()
    const r = rng(3)
    const pts = Array.from({ length: 60 }, (_, i) => {
      const avg = 180 + Math.sin(i / 8) * 60 + r() * 30
      return { t: T0 + i * MIN, avg, min: avg - 40 - r() * 30, max: avg + 60 + r() * 120 }
    })
    return {
      xAxis: { type: 'time' },
      yAxis: { type: 'value', name: 'ms' },
      tooltip: { trigger: 'axis' },
      series: [
        // min–max 밴드: min 선(투명) 위에 (max − min) 을 쌓아 칠한다
        { type: 'line', stack: 'band', symbol: 'none', lineStyle: { opacity: 0 }, data: pts.map((p) => [p.t, Math.round(p.min)]) },
        { name: 'min–max', type: 'line', stack: 'band', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: c.line.band }, data: pts.map((p) => [p.t, Math.round(p.max - p.min)]) },
        { name: 'avg', type: 'line', symbol: 'none', lineStyle: { color: c.line.avg, width: 2 }, data: pts.map((p) => [p.t, Math.round(p.avg)]) },
      ],
    }
  }, [])

  return (
    <PageGrid style={{ marginBottom: 'var(--space-5)' }}>
      <PageGridItem span={4}>
        <Card title="스캐터 (성공 accent 60% · 실패 crit)">
          <EChart option={scatter} aria-label="응답시간 스캐터 예시" />
        </Card>
      </PageGridItem>
      <PageGridItem span={4}>
        <Card title="히트맵 (accent 5단계 · 에러 crit)">
          <EChart option={heatmap} aria-label="응답시간 히트맵 예시" />
        </Card>
      </PageGridItem>
      <PageGridItem span={4}>
        <Card title="라인 (avg 실선 · min–max 밴드)">
          <EChart option={line} aria-label="평균 응답시간과 최소–최대 밴드 예시" />
        </Card>
      </PageGridItem>
    </PageGrid>
  )
}
