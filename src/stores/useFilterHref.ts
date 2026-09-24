import { useShallow } from 'zustand/react/shallow'
import { useFilters, type FilterValues } from './filters'
import { writeFilters } from './filtersUrl'

/**
 * 다른 화면으로 가는 링크 주소를 만든다. 지금 고른 서비스 · 시간 범위 · 새로고침 주기를 쿼리로 실어서,
 * 새 탭으로 열어도 같은 조건으로 보이게 한다. override 로 서비스 등을 바꿔 보낼 수 있다.
 *   const href = useFilterHref()
 *   <Link to={href('/transactions', { serviceName: 'shop-order' }, { tab: 'urls' })}>
 */
export function useFilterHref() {
  const filters = useFilters(useShallow((s) => ({ serviceName: s.serviceName, range: s.range, refreshSec: s.refreshSec })))
  return (path: string, override?: Partial<FilterValues>, extra?: Record<string, string>) =>
    `${path}?${writeFilters(new URLSearchParams(extra), { ...filters, ...override }).toString()}`
}
