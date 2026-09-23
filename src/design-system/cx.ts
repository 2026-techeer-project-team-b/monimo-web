/** 클래스 이름 이어 붙이기. falsy 는 건너뛴다. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
