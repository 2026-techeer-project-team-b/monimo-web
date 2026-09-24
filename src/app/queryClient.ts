import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 모니터링 화면은 자동 새로고침 주기(2단계)로 다시 불러온다. 창 포커스 때마다 다시 부르지 않는다
      refetchOnWindowFocus: false,
      // 4xx 는 다시 해도 같으므로 재시도하지 않는다. 5xx · 네트워크 오류만 1번
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
    },
    mutations: { retry: false },
  },
})
