import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../../cx'
import { CloseButton } from '../_internal/CloseButton'
import './Modal.css'

export type OverlayProps = {
  /** 클릭하면 창을 닫는 동작에 연결한다 */
  onClick?: () => void
  className?: string
}

/** Figma Overlay — 모달 · 드로어 뒤를 덮는 반투명 막 (bg/overlay 45%). 항상 창보다 한 단계 아래 */
export function Overlay({ onClick, className }: OverlayProps) {
  return <div aria-hidden className={cx('ds-overlay', className)} onClick={onClick} />
}

export type ModalProps = {
  open: boolean
  onClose: () => void
  /** Section/15 제목 */
  title: ReactNode
  /** 푸터 슬롯. 보통 취소(secondary) + 저장(primary). 되돌릴 수 없는 동작은 danger */
  footer?: ReactNode
  /** 본문 슬롯 (폼 · 표 · 안내 문구) */
  children: ReactNode
  className?: string
}

/**
 * Figma Modal — 중앙 확인 · 편집 창 (폭 600). 헤더 제목 + 닫기 · 본문 슬롯 · 푸터.
 * body 에 포털로 붙이고 뒤에 Overlay 를 깐다. Esc · 오버레이 클릭 · 닫기 버튼이 onClose 를 부른다.
 * 열리면 창으로 포커스가 가고 닫히면 원래 자리로 돌아간다. 포커스를 창 안에 가두는 트랩은 없다 (필요한 화면이 생기면 추가).
 */
export function Modal({ open, onClose, title, footer, children, className }: ModalProps) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="ds-modal-layer">
      <Overlay onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cx('ds-modal', className)}>
        <header className="ds-modal__header">
          <h2 id={titleId} className="ds-modal__title text-section-15">{title}</h2>
          <CloseButton onClick={onClose} />
        </header>
        <div className="ds-modal__body">{children}</div>
        {footer ? <footer className="ds-modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
