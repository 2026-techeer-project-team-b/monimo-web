import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../cx'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Figma `Button/Primary` · `Button/Secondary` · `Button/Danger`.
   * primary 는 화면당 1개(저장 · 적용 · 실행), danger 는 파괴적 동작(삭제 · 강제 해소)에만. 기본 secondary.
   */
  variant?: ButtonVariant
  /** Figma Button/Icon `Size=md(36) | lg(44)`. 기본 md */
  size?: 'md' | 'lg'
  /** 라벨 앞 아이콘 (04 아이콘 컴포넌트). Figma Button/Icon 의 INSTANCE_SWAP 자리 */
  icon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', icon, className, type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={cx('ds-button', `ds-button--${variant}`, size === 'lg' && 'ds-button--lg', 'text-body-13-strong', className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}
