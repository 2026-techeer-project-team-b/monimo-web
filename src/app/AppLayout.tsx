import type { MouseEvent } from 'react'
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { AppShell, Sidebar, Topbar } from '@/design-system'
import { useFilters, writeFilters } from '@/stores'
import { SCREENS, type ScreenMeta } from './screens'
import { TopbarControls } from './TopbarControls'
import { useAutoRefresh } from './useAutoRefresh'
import { useFilterUrlSync } from './useFilterUrlSync'
import { UserMenu } from './UserMenu'

/** 로그인 화면을 뺀 모든 화면의 틀 (06 P1). 사이드바 · 상단바 · 공통 상태 동기화는 여기서만 한다 */
export function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const matches = useMatches()
  const meta = [...matches].reverse().find((m) => m.handle)?.handle as ScreenMeta | undefined
  const activeKey = pathname.split('/')[1]

  useFilterUrlSync()
  useAutoRefresh()

  // 메뉴 링크에도 공통 상태를 실어서, 새 탭으로 열어도 같은 서비스 · 시간 범위가 보이게 한다
  const filters = useFilters(useShallow((s) => ({ serviceName: s.serviceName, range: s.range, refreshSec: s.refreshSec })))
  const query = writeFilters(new URLSearchParams(), filters).toString()
  const items = SCREENS.map((s) => ({ key: s.path, label: s.title, icon: s.icon, href: `/${s.path}?${query}` }))

  const onSelect = (key: string, e: MouseEvent<HTMLElement>) => {
    // Ctrl/⌘/Shift/Alt 클릭은 브라우저 기본 동작(새 탭 · 새 창)에 맡긴다
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(`/${key}?${query}`)
  }

  return (
    <AppShell
      sidebar={<Sidebar items={items} activeKey={activeKey} onSelect={onSelect} />}
      topbar={
        <Topbar title={meta?.title ?? ''} subtitle={meta?.subtitle}>
          <TopbarControls />
          <UserMenu />
        </Topbar>
      }
    >
      <Outlet />
    </AppShell>
  )
}
