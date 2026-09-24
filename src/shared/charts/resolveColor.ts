// 캔버스(ECharts)는 CSS 변수(var(--…)) · color-mix() 를 이해하지 못한다.
// 디자인 토큰 문자열을 브라우저에 한 번 계산시켜 rgba(…) 로 바꿔 넘긴다.

let probe: HTMLSpanElement | null = null
let ctx: CanvasRenderingContext2D | null = null
const cache = new Map<string, string>()

const clamp = (n: number) => Math.round(Math.min(255, Math.max(0, n)))

function parseComputed(v: string): string | null {
  // rgb(r, g, b) · rgba(r, g, b, a)
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/)
  if (rgb) return `rgba(${clamp(+rgb[1])}, ${clamp(+rgb[2])}, ${clamp(+rgb[3])}, ${rgb[4] ?? 1})`
  // color(srgb r g b / a) — color-mix(in srgb, …) 의 계산값
  const srgb = v.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/)
  if (srgb) return `rgba(${clamp(+srgb[1] * 255)}, ${clamp(+srgb[2] * 255)}, ${clamp(+srgb[3] * 255)}, ${srgb[4] ?? 1})`
  return null
}

/** 'var(--color-accent-default)' · 'color-mix(…)' → 'rgba(52, 82, 214, 1)'. 결과는 캐시한다 */
export function resolveColor(css: string): string {
  const hit = cache.get(css)
  if (hit) return hit
  probe ??= Object.assign(document.createElement('span'), { hidden: true })
  if (!probe.isConnected) document.body.appendChild(probe)
  probe.style.color = ''
  probe.style.color = css
  const computed = getComputedStyle(probe).color
  let out = parseComputed(computed)
  if (!out) {
    // 모르는 표기면 캔버스에 칠해서 읽는다 (투명도가 아주 낮으면 몇 단위 오차가 있을 수 있다)
    ctx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    if (!ctx) return css
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = computed
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    out = `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`
  }
  cache.set(css, out)
  return out
}

/** CSS 변수 값을 그대로 읽는다 (서체 이름 등) */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
