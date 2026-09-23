import type { ReactNode } from 'react'
import { cx } from '../../../cx'
import './Topbar.css'

export type TopbarProps = {
  /** Title/20 페이지 제목 */
  title: ReactNode
  /** Caption/12 부제 */
  subtitle?: ReactNode
  /** 우측 컨트롤 (서비스 Select · 시간범위 Segmented · 새로고침 · 사용자 칩). 조합은 화면이 정한다 */
  children?: ReactNode
  className?: string
}

/**
 * Figma Shell/Topbar — 화면 상단바 (높이 size/topbar · bg/surface · 하단 border/default).
 * 사이드바와 짝으로 모든 화면 상단에 고정한다.
 */
export function Topbar({ title, subtitle, children, className }: TopbarProps) {
  return (
    <header className={cx('ds-topbar', className)}>
      <div className="ds-topbar__heading">
        <h1 className="ds-topbar__title text-title-20">{title}</h1>
        {subtitle ? <p className="ds-topbar__subtitle text-caption-12">{subtitle}</p> : null}
      </div>
      {children ? <div className="ds-topbar__controls">{children}</div> : null}
    </header>
  )
}
