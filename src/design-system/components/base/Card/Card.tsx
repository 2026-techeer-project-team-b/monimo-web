import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../cx'
import './Card.css'

export type CardProps = HTMLAttributes<HTMLElement> & {
  /** Section/15 제목. 없으면 헤더 없이 본문만 */
  title?: ReactNode
  /** 제목 우측 액션 (Button 등) */
  actions?: ReactNode
}

/**
 * 본문 콘텐츠 컨테이너. 차트 · 표 · 요약 블록을 감싸는 기본 패널.
 * bg/surface + border/default · radius/md · padding space/4 · gap space/3 · Shadow/card.
 */
export function Card({ title, actions, className, children, ...rest }: CardProps) {
  return (
    <section className={cx('ds-card', className)} {...rest}>
      {title || actions ? (
        <header className="ds-card__header">
          {title ? <h2 className="ds-card__title text-section-15">{title}</h2> : null}
          {actions ? <div className="ds-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}
