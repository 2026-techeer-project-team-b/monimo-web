import type { ReactNode } from 'react'
import { cx } from '../../cx'
import { Button, Card } from '../../components/base'
import './TableCard.css'

export type CursorPagerProps = {
  /** 이전 커서가 없으면 false (첫 구간) */
  hasPrev: boolean
  /** 다음 커서가 없으면 false (마지막 구간) */
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}

/** Figma 06 P2 커서 버튼 — 쪽 번호 없이 이전 · 다음만. 끝에 닿으면 해당 버튼을 끈다 */
export function CursorPager({ hasPrev, hasNext, onPrev, onNext, className }: CursorPagerProps) {
  return (
    <nav aria-label="목록 이동" className={cx('ds-cursor-pager', className)}>
      <Button disabled={!hasPrev} onClick={onPrev}>이전</Button>
      <Button disabled={!hasNext} onClick={onNext}>다음</Button>
    </nav>
  )
}

export type TableCardProps = {
  /** Section/15 카드 제목 */
  title: ReactNode
  /** 제목 우측 액션 (내보내기 등) */
  actions?: ReactNode
  /** <Table> 하나. 테두리 · 반경은 여기서 감싼다 */
  children: ReactNode
  /** 표 아래 좌측 캡션. 예: 1,284건 · limit 50 · 커서 페이징 */
  summary?: ReactNode
  /** 표 아래 우측. 보통 <CursorPager> */
  pager?: ReactNode
  className?: string
}

/**
 * Figma 06 P2 카드 · 표 규칙 — 카드(제목 + 우측 액션) 안에 표, 아래에 건수 캡션과 커서 버튼.
 * 표 규칙: 헤더 surface-2 · 행 40 · 수치 우측 정렬 mono · ID mono · 선택 행 accent/soft (05-B Table 이 맡는다).
 * 시각은 formatTime, UUID 는 shortId 로 줄여 적는다.
 */
export function TableCard({ title, actions, children, summary, pager, className }: TableCardProps) {
  return (
    <Card title={title} actions={actions} className={cx('ds-table-card', className)}>
      <div className="ds-table-card__table">{children}</div>
      {summary || pager ? (
        <footer className="ds-table-card__footer">
          <span className="ds-table-card__summary text-caption-12">{summary}</span>
          {pager}
        </footer>
      ) : null}
    </Card>
  )
}
