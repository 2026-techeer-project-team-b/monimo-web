import { cx } from '../../../cx'
import { Button } from '../../base'
import './Pagination.css'

export type PaginationProps = {
  /** 현재 구간 첫 번째 (1부터) */
  start: number
  /** 현재 구간 마지막 */
  end: number
  total: number
  onPrev: () => void
  onNext: () => void
  className?: string
}

/**
 * Figma Pagination — 표 아래 우측. 이전/다음 Secondary 버튼 + 가운데 Mono/12 커서 (예: 1–20 / 184).
 * 첫/마지막 페이지에서는 해당 버튼을 비활성으로 둔다.
 */
export function Pagination({ start, end, total, onPrev, onNext, className }: PaginationProps) {
  return (
    <nav aria-label="페이지 이동" className={cx('ds-pagination', className)}>
      <Button variant="secondary" disabled={start <= 1} onClick={onPrev}>이전</Button>
      <span className="ds-pagination__cursor text-mono-12">{start}–{end} / {total}</span>
      <Button variant="secondary" disabled={end >= total} onClick={onNext}>다음</Button>
    </nav>
  )
}
