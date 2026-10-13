// 로그인 토큰 보관.
// - access 토큰: 메모리에만 둔다. 새로고침하면 사라지고, 앱이 시작할 때 refresh 로 다시 받는다.
// - refresh 토큰: 화면이 갖지 않는다. 서버가 httpOnly 쿠키(monimo_refresh)로 심어 재발급 · 로그아웃 때 브라우저가 알아서 붙인다 (backend #35).
//   JS 가 못 읽는 쿠키라 XSS 로 새지 않는다. 그래서 다른 탭에 로그인 · 로그아웃을 알리는 표식만 localStorage 에 둔다 (값은 토큰이 아니다).

/** 로그인 상태 표식. 값이 있으면 어느 탭이 로그인했다는 뜻이고, 지워지면 로그아웃이다. 다른 탭이 storage 이벤트로 따라간다 */
export const SESSION_KEY = 'monimo.session'

let accessToken: string | null = null
/** 로그아웃 · 세션 종료마다 1씩 늘어난다. 그 전에 시작된 재발급 · 요청의 결과를 버리는 데 쓴다 */
let generation = 0
const expiredListeners = new Set<() => void>()

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null // 사생활 보호 모드 등에서 저장소를 못 쓰면 탭 동기화만 안 될 뿐이다
  }
}

export const tokens = {
  generation: () => generation,
  getAccess: () => accessToken,
  setAccess: (token: string | null) => {
    accessToken = token
  },
  /** 로그인했다고 다른 탭에 알린다 */
  markSession: () => storage()?.setItem(SESSION_KEY, String(Date.now())),
  clear: () => {
    generation += 1
    accessToken = null
    storage()?.removeItem(SESSION_KEY)
  },
  /** 다른 탭이 저장소를 바꿨을 때: 이 탭의 access 만 버리고 세대를 올린다 */
  dropAccess: () => {
    generation += 1
    accessToken = null
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
