import type { HTMLAttributes } from 'react'
import { cx } from '../../../cx'
import { IconAlertCircle, IconCheck } from '../../../icons'
import { CloseButton } from '../_internal/CloseButton'
import './Toast.css'

export type ToastTone = 'ok' | 'crit'

export type ToastProps = HTMLAttributes<HTMLDivElement> & {
  /** Figma `Tone=ok | crit` */
  tone: ToastTone
  onClose?: () => void
}

/**
 * Figma Toast — 방금 동작의 결과 알림 (저장 완료 · 전송 실패). 폭 372 고정.
 * 우측 하단에 띄우고 몇 초 뒤 지우는 것(위치 · 타이머 · 스택)은 화면의 토스트 컨테이너가 맡는다. 계속 떠 있어야 하면 Banner.
 */
export function Toast({ tone, onClose, className, children, ...rest }: ToastProps) {
  return (
    <div role="status" className={cx('ds-toast', `ds-toast--${tone}`, className)} {...rest}>
      <span className="ds-toast__icon">{tone === 'ok' ? <IconCheck /> : <IconAlertCircle />}</span>
      <div className="ds-toast__body text-body-13">{children}</div>
      {onClose ? <CloseButton onClick={onClose} /> : null}
    </div>
  )
}
