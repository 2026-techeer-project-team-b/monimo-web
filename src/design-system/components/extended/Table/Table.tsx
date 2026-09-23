import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cx } from '../../../cx'
import './Table.css'

/**
 * Figma Table/HeaderCell · Table/Cell · Table/Row — 네이티브 <table> 시맨틱 위에 얹는다.
 *   <Table>
 *     <TableHead><tr><TableHeaderCell>서비스</TableHeaderCell><TableHeaderCell align="right">건수</TableHeaderCell></tr></TableHead>
 *     <TableBody><TableRow selected><TableCell>shop-order</TableCell><TableCell type="number">1,284</TableCell></TableRow></TableBody>
 *   </Table>
 * 컬럼 폭은 화면이 <col> 이나 style 로 정한다. 표 데이터 타입은 여기서 정의하지 않는다.
 */
export function Table({ className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cx('ds-table', className)} {...rest} />
}

export function TableHead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cx('ds-table__head', className)} {...rest} />
}

export function TableBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cx('ds-table__body', className)} {...rest} />
}

export type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  /** 수치 컬럼이면 right (본문 셀 정렬과 맞춘다) */
  align?: 'left' | 'right'
}

/** Figma Table/HeaderCell — bg/surface-2 · 높이 36 · Caption/12 Medium · text/tertiary */
export function TableHeaderCell({ align = 'left', className, ...rest }: TableHeaderCellProps) {
  return <th scope="col" className={cx('ds-table__th', `ds-table__th--${align}`, 'text-caption-12-medium', className)} {...rest} />
}

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Figma `Selected=true`: accent/soft 배경. 드로어에 열려 있는 행 */
  selected?: boolean
}

/** Figma Table/Row — 높이 40. onClick 이 있으면 클릭 가능한 행으로 보인다 */
export function TableRow({ selected, className, onClick, ...rest }: TableRowProps) {
  return (
    <tr
      aria-selected={selected || undefined}
      className={cx('ds-table__row', selected && 'ds-table__row--selected', onClick && 'ds-table__row--clickable', className)}
      onClick={onClick}
      {...rest}
    />
  )
}

export type TableCellType = 'text' | 'mono' | 'number' | 'badge'

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  /** Figma `Type=text | mono | number | badge`. number 는 우측 정렬 · mono. badge 는 Badge · StatusBadge 를 children 으로 */
  type?: TableCellType
}

const CELL_TEXT: Record<TableCellType, string> = {
  text: 'text-body-13',
  mono: 'text-mono-12',
  number: 'text-mono-12',
  badge: '',
}

/** Figma Table/Cell — 높이 40 · 아래선 border/default · 좌우 space/3 */
export function TableCell({ type = 'text', className, ...rest }: TableCellProps) {
  return <td className={cx('ds-table__td', `ds-table__td--${type}`, CELL_TEXT[type], className)} {...rest} />
}
