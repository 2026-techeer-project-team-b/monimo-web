/** 로그인 뒤 돌아갈 주소. 다른 사이트로 튀는 주소(//evil.com 등)는 막고 첫 화면으로 */
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || next.startsWith('/login')) return '/server-map'
  return next
}
