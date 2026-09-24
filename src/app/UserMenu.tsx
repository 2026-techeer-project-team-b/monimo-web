import { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '@/auth'
import { Badge } from '@/design-system'
import './UserMenu.css'

/**
 * 상단바 우측 사용자 칩 (이니셜 · 이름 · 역할 배지). 누르면 이메일 · 로그아웃이 펼쳐진다.
 * 항목이 하나뿐이라 menu 위젯이 아니라 단순 펼침(disclosure)으로 만든다. 열면 로그아웃 버튼으로, Esc 로 닫으면 칩으로 포커스가 간다.
 */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLButtonElement>(null)
  const logoutRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    logoutRef.current?.focus()
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      chipRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div className="user-menu" ref={rootRef}>
      <button ref={chipRef} type="button" className="user-menu__chip" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <span aria-hidden className="user-menu__avatar text-caption-12-medium">{user.name.slice(0, 1)}</span>
        <span className="user-menu__name text-body-13">{user.name}</span>
        <Badge tone="accent">{user.role}</Badge>
      </button>
      {open ? (
        <div id={panelId} className="user-menu__panel">
          <div className="user-menu__email text-caption-12">{user.email}</div>
          <button ref={logoutRef} type="button" className="user-menu__item text-body-13" onClick={() => void logout()}>
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  )
}
