import type { SelectHTMLAttributes } from 'react'
import { cx } from '../../../cx'
import { IconChevronDown } from '../../../icons'
import './Select.css'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

/**
 * 드롭다운 선택. 서비스 · 기간 · 심각도처럼 값이 정해진 목록에서 하나를 고른다.
 * 선택지가 3개 이하이고 즉시 전환이면 (05-B) Segmented 를 쓴다. 폭은 부모가 정한다 (기본 160).
 * 네이티브 <select> 를 감싸므로 <option> 을 children 으로 넣는다.
 */
export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <span className={cx('ds-select', className)}>
      <select className="ds-select__native text-body-13" {...rest}>
        {children}
      </select>
      <IconChevronDown size={12} className="ds-select__chevron" />
    </span>
  )
}
