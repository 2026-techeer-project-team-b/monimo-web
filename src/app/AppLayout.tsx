import type { MouseEvent } from 'react'
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router'
import { AppShell, Sidebar, Topbar } from '@/design-system'
import { SCREENS, type ScreenMeta } from './screens'
import { UserMenu } from './UserMenu'

const NAV_ITEMS = SCREENS.map((s) => ({ key: s.path, label: s.title, icon: s.icon, href: `/${s.path}` }))

/** 로그인 화면을 뺀 모든 화면의 틀 (06 P1). 사이드바 · 상단바는 여기서만 그린다 */
export function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const matches = useMatches()
  const meta = [...matches].reverse().find((m) => m.handle)?.handle as ScreenMeta | undefined
  const activeKey = pathname.split('/')[1]

  const onSelect = (key: string, e: MouseEvent<HTMLElement>) => {
    // Ctrl/⌘/Shift/Alt 클릭은 브라우저 기본 동작(새 탭 · 새 창)에 맡긴다
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(`/${key}`)
  }

  return (
    <AppShell
      sidebar={<Sidebar items={NAV_ITEMS} activeKey={activeKey} onSelect={onSelect} />}
      topbar={
        <Topbar title={meta?.title ?? ''} subtitle={meta?.subtitle}>
          <UserMenu />
        </Topbar>
      }
    >
      <Outlet />
    </AppShell>
  )
}
