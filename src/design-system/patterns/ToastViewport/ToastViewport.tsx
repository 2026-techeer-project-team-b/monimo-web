import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './ToastViewport.css'

/**
 * Figma 06 P3 — 드로어가 열려도 표의 핵심 컬럼이 가려지지 않도록, 핵심 컬럼은 화면 왼쪽 이 폭 안에 둔다
 * (1440 − 드로어 480 − 여백 20).
 */
export const DRAWER_SAFE_WIDTH = 940

export type ToastViewportProps = {
  /** <Toast> 들. 위에서 아래로 쌓인다 */
  children: ReactNode
}

/**
 * Figma 06 P3 토스트 자리 — 우측 상단 top 140 · right 24, 레이어는 가장 위(--layer-toast).
 * body 에 포털로 붙는다. 몇 초 뒤 지우는 타이머 · 목록 상태는 화면(앱)이 가진다.
 */
export function ToastViewport({ children }: ToastViewportProps) {
  return createPortal(
    <div className="ds-toast-viewport" aria-live="polite">
      {children}
    </div>,
    document.body,
  )
}
