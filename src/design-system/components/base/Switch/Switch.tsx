import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../../cx'
import './Switch.css'

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'onClick'> & {
  /** Figma `State=On | Off` */
  checked: boolean
  onChange?: (checked: boolean) => void
}

/**
 * 켜짐/꺼짐 토글. 경보 규칙 활성화 · 채널 사용 여부처럼 즉시 반영되는 2값 설정에 쓴다.
 * 저장 버튼이 있는 폼에는 Checkbox 를 쓴다. 접근성 이름은 aria-label 또는 aria-labelledby 로 준다.
 */
export function Switch({ checked, onChange, className, disabled, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cx('ds-switch', checked && 'ds-switch--on', className)}
      onClick={() => onChange?.(!checked)}
      {...rest}
    >
      <span className="ds-switch__knob" />
    </button>
  )
}
