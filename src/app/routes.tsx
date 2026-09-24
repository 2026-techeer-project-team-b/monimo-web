// 경로 정의. 화면 목록은 screens.tsx 에서 가져온다.
import { Navigate, type RouteObject } from 'react-router'
import { AppLayout } from './AppLayout'
import { NotFound, RouteError } from './RouteError'
import { SCREENS, type ScreenMeta } from './screens'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/server-map" replace /> },
      ...SCREENS.map((s) => ({ path: s.path, handle: { title: s.title, subtitle: s.subtitle } satisfies ScreenMeta, lazy: s.load })),
      { path: '*', handle: { title: '페이지 없음' } satisfies ScreenMeta, element: <NotFound /> },
    ],
  },
  // 디자인 시스템 미리보기. 사이드바에는 없고 주소로만 들어간다
  { path: '/design-system', lazy: () => import('./DesignSystemPreview').then((m) => ({ Component: m.DesignSystemPreview })) },
]
