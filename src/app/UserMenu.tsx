import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/auth'
import { Badge } from '@/design-system'
import './UserMenu.css'

/** 상단바 우측 사용자 칩 (이니셜 · 이름 · 역할 배지). 누르면 로그아웃 메뉴 */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-menu__chip" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span aria-hidden className="user-menu__avatar text-caption-12-medium">{user.name.slice(0, 1)}</span>
        <span className="user-menu__name text-body-13">{user.name}</span>
        <Badge tone="accent">{user.role}</Badge>
      </button>
      {open ? (
        <div role="menu" className="user-menu__panel">
          <div className="user-menu__email text-caption-12">{user.email}</div>
          <button type="button" role="menuitem" className="user-menu__item text-body-13" onClick={() => void logout()}>
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  )
}
