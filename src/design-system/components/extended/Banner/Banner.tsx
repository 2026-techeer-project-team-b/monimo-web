import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../cx'
import { IconAlertCircle, IconAlertTriangle, IconCheck, IconInfo } from '../../../icons'
import './Banner.css'

export type BannerTone = 'info' | 'ok' | 'warn' | 'crit'

export type BannerProps = HTMLAttributes<HTMLDivElement> & {
  /** Figma `Tone=info | ok | warn | crit`. 기본 info */
  tone?: BannerTone
  /** 우측 액션. 예: <a>자세히</a> */
  action?: ReactNode
}

const ICON: Record<BannerTone, ReactNode> = {
  info: <IconInfo />,
  ok: <IconCheck />,
  warn: <IconAlertTriangle />,
  crit: <IconAlertCircle />,
}

/**
 * Figma Banner — 화면 상단 안내. 본문 위에 가로로 꽉 차게 놓아 현재 상황과 다음 행동을 알린다 (수집 지연 · 권한 부족 · 점검 공지).
 * soft 배경 + 같은 톤 아이콘 · 글자. 높이는 내용에 맞춰 늘어난다. 일시적 완료 알림은 Toast.
 */
export function Banner({ tone = 'info', action, className, children, ...rest }: BannerProps) {
  return (
    <div role="status" className={cx('ds-banner', `ds-banner--${tone}`, className)} {...rest}>
      <span className="ds-banner__icon">{ICON[tone]}</span>
      <div className="ds-banner__body text-body-13">{children}</div>
      {action ? <div className="ds-banner__action text-caption-12-medium">{action}</div> : null}
    </div>
  )
}
