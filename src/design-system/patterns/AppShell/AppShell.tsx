import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../cx'
import './AppShell.css'

export type AppShellProps = {
  /** 보통 <Sidebar> (폭 size/sidebar 224 고정) */
  sidebar: ReactNode
  /** 보통 <Topbar> (높이 size/topbar 56 고정) */
  topbar: ReactNode
  /** 본문. 보통 <PageGrid> 안에 카드를 올린다 */
  children: ReactNode
  className?: string
}

/**
 * Figma 06 P1 앱 셸 — 사이드바 224 고정 · 상단바 56 고정 · 본문 padding 24 · bg/canvas.
 * 화면 폭 1440 기준, 높이는 내용에 따라 늘어난다 (잘림 없음). 로그인 화면을 뺀 모든 화면이 이 틀을 쓴다.
 */
export function AppShell({ sidebar, topbar, children, className }: AppShellProps) {
  return (
    <div className={cx('ds-app-shell', className)}>
      <div className="ds-app-shell__sidebar">{sidebar}</div>
      <div className="ds-app-shell__main">
        <div className="ds-app-shell__topbar">{topbar}</div>
        <main className="ds-app-shell__content">{children}</main>
      </div>
    </div>
  )
}

export type PageGridProps = HTMLAttributes<HTMLDivElement>

/** Figma 06 P1 본문 격자 — 12열 · 열 간격 = 카드 gap 16. 자식은 <PageGridItem span> */
export function PageGrid({ className, ...rest }: PageGridProps) {
  return <div className={cx('ds-page-grid', className)} {...rest} />
}

export type PageGridItemProps = HTMLAttributes<HTMLDivElement> & {
  /** 차지할 열 수 1~12. 기본 12 (한 줄 전체) */
  span?: number
}

export function PageGridItem({ span = 12, className, style, ...rest }: PageGridItemProps) {
  return (
    <div
      className={cx('ds-page-grid__item', className)}
      style={{ ...style, '--ds-span': Math.min(12, Math.max(1, span)) } as CSSProperties}
      {...rest}
    />
  )
}
