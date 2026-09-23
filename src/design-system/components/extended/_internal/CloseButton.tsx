import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../../cx'
import { IconClose } from '../../../icons'
import './CloseButton.css'

/** 모달 · 드로어 · 토스트 우상단 닫기. Figma Icon/close 규칙대로 클릭 영역 32×32. index 로 내보내지 않는 내부 부품 */
export function CloseButton({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label="닫기" className={cx('ds-close-button', className)} {...rest}>
      <IconClose />
    </button>
  )
}
