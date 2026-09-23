import type { HTMLAttributes } from 'react'
import { cx } from '../../../cx'
import type { Tone } from '../../base'
import './StatusBadge.css'

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** 기본 muted */
  tone?: Tone
}

/**
 * Figma StatusBadge — 좌측 6px 점 + Mono/12 Strong 대문자 라벨. FIRING · RESOLVED · UP · DOWN · UNKNOWN 같은 시스템 상태 값.
 * 점 없이 분류만 보여줄 때는 Badge, 점만 필요하면 StatusDot.
 */
export function StatusBadge({ tone = 'muted', className, children, ...rest }: StatusBadgeProps) {
  return (
    <span className={cx('ds-status-badge', `ds-status-badge--${tone}`, 'text-mono-12-strong', className)} {...rest}>
      <span aria-hidden className="ds-status-badge__dot" />
      {children}
    </span>
  )
}
