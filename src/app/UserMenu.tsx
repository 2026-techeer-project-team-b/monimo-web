import { useId } from 'react'
import { useAuth } from '@/auth'
import { Badge } from '@/design-system'
import { usePopover } from './usePopover'
import './UserMenu.css'

/**
 * 상단바 우측 사용자 칩 (이니셜 · 이름 · 역할 배지). 누르면 이메일 · 로그아웃이 펼쳐진다.
 * 항목이 하나뿐이라 menu 위젯이 아니라 단순 펼침(disclosure)으로 만든다.
 */
export function UserMenu() {
  const { user, logout } = useAuth()
  const { open, toggle, rootRef, triggerRef, panelRef } = usePopover()
  const panelId = useId()
  if (!user) return null

  return (
    <div className="user-menu" ref={rootRef}>
      <button ref={triggerRef} type="button" className="user-menu__chip" aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        <span aria-hidden className="user-menu__avatar text-caption-12-medium">{user.name.slice(0, 1)}</span>
        <span className="user-menu__name text-body-13">{user.name}</span>
        <Badge tone="accent">{user.role}</Badge>
      </button>
      {open ? (
        <div ref={panelRef} id={panelId} className="user-menu__panel topbar-panel">
          <div className="user-menu__email text-caption-12">{user.email}</div>
          <button type="button" className="user-menu__item text-body-13" onClick={() => void logout()}>
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  )
}
