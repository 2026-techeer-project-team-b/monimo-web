import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../../cx'
import './Chip.css'

export type ChipTone = 'default' | 'ok' | 'warn' | 'crit'

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'onClick'> & {
  /** Figma `Selected=true|false` */
  selected: boolean
  /** Figma `Tone=default|ok|warn|crit`. 기본 default */
  tone?: ChipTone
  onChange?: (selected: boolean) => void
}

/**
 * Figma Chip — 다중 선택 필터 칩. 경보 · 로그 · 에러 목록 위에서 심각도나 상태를 토글한다.
 * 선택 시 tone soft 배경 + 같은 tone 테두리 · 글자, 해제 시 흰 배경 + border/strong.
 */
export function Chip({ selected, tone = 'default', onChange, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx('ds-chip', `ds-chip--${tone}`, selected && 'ds-chip--selected', 'text-caption-12-medium', className)}
      onClick={() => onChange?.(!selected)}
      {...rest}
    >
      {children}
    </button>
  )
}
