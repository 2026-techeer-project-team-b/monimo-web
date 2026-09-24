// Figma 06 P2 표기 규칙 — 시각은 14:38:12.481, UUID 는 a3f1…9c2e 로 줄여 적는다.

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

/** Date · epoch ms · ISO 문자열 → HH:MM:SS.mmm (브라우저 로컬 시각) */
export function formatTime(value: Date | number | string): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

/** 긴 ID → 대시를 뺀 문자열의 앞 4 + … + 끝 4. 대시를 뺀 길이가 10자 이하면 원래 값 그대로. 전체 값은 title 속성 등으로 따로 보여준다 */
export function shortId(id: string, head = 4, tail = 4): string {
  const s = id.replace(/-/g, '')
  return s.length <= head + tail + 2 ? id : `${s.slice(0, head)}…${s.slice(-tail)}`
}
