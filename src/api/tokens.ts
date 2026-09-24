// 로그인 토큰 보관.
// - access 토큰: 메모리에만 둔다. 새로고침하면 사라지고, 앱이 시작할 때 refresh 로 다시 받는다.
// - refresh 토큰: 새로고침 뒤에도 로그인이 유지되도록 localStorage 에 둔다.
//   명세(api-spec §0 · 28번)가 refresh 를 응답 본문으로 주기 때문이다. XSS 에 노출될 수 있으므로
//   백엔드가 httpOnly 쿠키로 바꾸면 이 파일의 refresh 부분만 지우면 된다.

const REFRESH_KEY = 'monimo.refresh_token'

let accessToken: string | null = null
const expiredListeners = new Set<() => void>()

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null // 사생활 보호 모드 등에서 저장소를 못 쓰면 새로고침 때 로그인이 풀릴 뿐이다
  }
}

export const tokens = {
  getAccess: () => accessToken,
  setAccess: (token: string | null) => {
    accessToken = token
  },
  getRefresh: () => storage()?.getItem(REFRESH_KEY) ?? null,
  setRefresh: (token: string | null) => {
    const s = storage()
    if (!s) return
    if (token) s.setItem(REFRESH_KEY, token)
    else s.removeItem(REFRESH_KEY)
  },
  clear: () => {
    accessToken = null
    tokens.setRefresh(null)
  },
}

/** 재발급까지 실패해 세션이 끝났을 때 알림을 받는다. 해제 함수를 돌려준다 */
export function onSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener)
  return () => expiredListeners.delete(listener)
}

export function notifySessionExpired() {
  expiredListeners.forEach((l) => l())
}
