import type { HTMLAttributes } from 'react'
import { cx } from '../../../cx'
import type { Tone } from '../Badge'
import './StatusDot.css'

export type StatusDotProps = HTMLAttributes<HTMLSpanElement> & {
  /** 기본 muted */
  tone?: Tone
}

/**
 * 8px 상태 점. 표 행 · 목록 앞에 붙여 UP/DOWN/UNKNOWN, 정상/경고/위험을 보여준다.
 * 단독으로 쓰지 말고 항상 글자 라벨과 같이 둔다 (장식이므로 aria-hidden).
 */
export function StatusDot({ tone = 'muted', className, ...rest }: StatusDotProps) {
  return <span aria-hidden className={cx('ds-status-dot', `ds-status-dot--${tone}`, className)} {...rest} />
}
