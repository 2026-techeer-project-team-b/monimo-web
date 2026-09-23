import type { ReactNode } from 'react'
import { cx } from '../../../cx'
import { Badge, Card } from '../../base'
import './KPICard.css'

export type KPICardTone = 'default' | 'ok' | 'crit'

export type KPICardProps = {
  /** Caption/12 라벨. 예: P95 응답시간 */
  label: ReactNode
  /** Number/28 수치. 예: 482 ms */
  value: ReactNode
  /** 변화 배지 문구. 예: +18%. 없으면 배지 없음 */
  delta?: ReactNode
  /** Caption/12 보조. 예: 임계값 초과 */
  caption?: ReactNode
  /** Figma `Tone=default | ok | crit`. 수치 색과 배지 톤을 맞춘다 */
  tone?: KPICardTone
  className?: string
}

const BADGE_TONE = { default: 'accent', ok: 'ok', crit: 'crit' } as const

/** Figma KPICard — 대시보드 상단 단일 수치 카드. Card 위에 라벨 · 수치 · 변화 배지 · 보조 캡션을 쌓는다 */
export function KPICard({ label, value, delta, caption, tone = 'default', className }: KPICardProps) {
  return (
    <Card className={cx('ds-kpi', `ds-kpi--${tone}`, className)}>
      <div className="ds-kpi__label text-caption-12">{label}</div>
      <div className="ds-kpi__row">
        <div className="ds-kpi__value text-number-28">{value}</div>
        {delta ? <Badge tone={BADGE_TONE[tone]}>{delta}</Badge> : null}
      </div>
      {caption ? <div className="ds-kpi__caption text-caption-12">{caption}</div> : null}
    </Card>
  )
}
