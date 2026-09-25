import type { ReactNode } from 'react'

/** 카드 안의 안내 한 줄 (선택 없음 · 불러오는 중 · 빈 결과 · 오류) */
export function CardNotice({ children }: { children: ReactNode }) {
  return (
    <p className="sm-card-notice text-body-13" role="status">
      {children}
    </p>
  )
}
