import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getCanary } from '@/api'
import { SidebarStatusCard } from '@/design-system'
import { useFilterHref } from '@/stores'
import './WatchdogCard.css'

/**
 * 사이드바 아래 파수꾼 카드 — 카나리 신선도(제안 문 #51)를 30초마다 읽어 3색으로 보여 준다.
 * 초록 = 카나리가 기준 안에 관통, 빨강 = 늦음(감시 체계 어딘가가 막힘), 회색 = 모름(읽기 실패).
 * 누르면 플랫폼 상태 화면으로 간다
 */
export function WatchdogCard() {
  const href = useFilterHref()
  const q = useQuery({ queryKey: ['platform-canary'], queryFn: ({ signal }) => getCanary(signal), refetchInterval: 30_000, retry: false })
  const c = q.data
  // 읽기에 실패했으면 이전 값이 있어도 믿지 않는다 — 감시 체계를 보는 카드라 "모름" 이 정직하다
  const known = c && !q.isError

  return (
    <Link to={href('/platform')} className="watchdog-card" aria-label={`파수꾼 · 카나리: ${known ? (c.fresh ? '정상' : '늦음') : '확인 안 됨'} — 플랫폼 상태 보기`}>
      <SidebarStatusCard
        title="파수꾼 · 카나리"
        tone={!known ? 'muted' : c.fresh ? 'ok' : 'crit'}
        value={known ? `${c.age_sec}초 전` : '—'}
        caption={!known ? (q.isError ? '확인 안 됨' : '확인 중') : `${c.fresh ? '정상' : '늦음'} (기준 ${c.threshold_sec}초)`}
      />
    </Link>
  )
}
