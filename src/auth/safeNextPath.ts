/**
 * 로그인 뒤 돌아갈 주소. 같은 사이트의 경로만 허용하고, 그 밖(//evil.com · /\\evil · 제어문자 섞인 주소 · /login 자신)은 첫 화면으로.
 * 문자열 검사에 더해 실제로 URL 을 해석해 출처(origin)가 같은지 확인한다.
 */
export function safeNextPath(next: string | null): string {
  const fallback = '/server-map'
  // eslint-disable-next-line no-control-regex
  if (!next || !next.startsWith('/') || /[\u0000-\u001f\\]/.test(next)) return fallback
  try {
    const url = new URL(next, window.location.origin)
    if (url.origin !== window.location.origin || /^\/login(\/|$)/i.test(url.pathname)) return fallback
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}
