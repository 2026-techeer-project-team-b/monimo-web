// 앱 뼈대: 서버 데이터(TanStack Query) + 경로(React Router).
// 여러 화면이 같이 쓰는 값(서비스 · 시간범위 · 새로고침 주기)은 2단계에서 stores/ 에 붙인다.
import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { queryClient } from './queryClient'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
