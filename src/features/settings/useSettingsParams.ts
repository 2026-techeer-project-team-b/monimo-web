import { useSearchParams } from 'react-router'

/** 설정 주소 쿼리 — app(고른 서비스 uuid). 바꿀 때 기록은 남기지 않는다(replace) */
export function useSettingsParams() {
  const [params, setParams] = useSearchParams()
  return {
    appId: params.get('app'),
    selectApp: (id: string | null) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (id) p.set('app', id)
          else p.delete('app')
          return p
        },
        { replace: true },
      ),
  }
}
