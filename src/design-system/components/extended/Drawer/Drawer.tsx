import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cx } from '../../../cx'
import { CloseButton } from '../_internal/CloseButton'
import './Drawer.css'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  /** Section/15 제목 */
  title: ReactNode
  /** 본문 슬롯 (스팬 목록 · 속성 표 · 로그) */
  children: ReactNode
  className?: string
}

/**
 * Figma Drawer — 우측 상세 패널 (폭 size/drawer · 화면 전체 높이). 표에서 행을 고르면 열려 트레이스 · 경보 · 에이전트 상세를 보여준다.
 * 좌측 1px border/default + Shadow/overlay 로 본문과 분리. 뒤 화면은 계속 조작할 수 있다 (오버레이 없음). Esc 로 닫힌다.
 * 확인이 필요한 짧은 동작은 Modal.
 */
export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  const titleId = useId()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <aside ref={ref} role="dialog" aria-labelledby={titleId} tabIndex={-1} className={cx('ds-drawer', className)}>
      <header className="ds-drawer__header">
        <h2 id={titleId} className="ds-drawer__title text-section-15">{title}</h2>
        <CloseButton onClick={onClose} />
      </header>
      <div className="ds-drawer__body">{children}</div>
    </aside>
  )
}
