import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../cx'
import { IconCheck } from '../../../icons'
import './Checkbox.css'

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  /** Body/13 라벨 */
  children?: ReactNode
}

/**
 * Figma Checkbox — 폼용 다중 선택. 16×16 상자 + Body/13 라벨. 저장 버튼과 함께 쓰는 폼 항목.
 * 즉시 적용되는 켜짐/꺼짐은 Switch. 네이티브 <input type="checkbox"> 를 감싸므로 checked · onChange 를 그대로 쓴다.
 */
export function Checkbox({ className, children, ...rest }: CheckboxProps) {
  return (
    <label className={cx('ds-checkbox', 'text-body-13', className)}>
      <input type="checkbox" className="ds-checkbox__input" {...rest} />
      <span aria-hidden className="ds-checkbox__box">
        <IconCheck size={12} className="ds-checkbox__check" />
      </span>
      {children ? <span className="ds-checkbox__label">{children}</span> : null}
    </label>
  )
}
