import type { HTMLAttributes } from 'react'
import { cx } from '../../../cx'
import './Badge.css'

/** Figma Badge `Tone=ok | warn | crit | muted | accent`. StatusDot 과 같은 값을 쓴다. */
export type Tone = 'ok' | 'warn' | 'crit' | 'muted' | 'accent'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** 기본 muted */
  tone?: Tone
}

/**
 * 상태 · 분류 라벨 배지. severity(CRITICAL/WARNING/INFO) · state(FIRING/RESOLVED) · 역할(ADMIN) 같은 짧은 글자에 쓴다.
 * soft 배경 + 같은 계열 진한 글자 (01 대비 규칙). 점이 필요하면 StatusDot 을 앞에 둔다.
 */
export function Badge({ tone = 'muted', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx('ds-badge', `ds-badge--${tone}`, 'text-caption-12-medium', className)} {...rest}>
      {children}
    </span>
  )
}
