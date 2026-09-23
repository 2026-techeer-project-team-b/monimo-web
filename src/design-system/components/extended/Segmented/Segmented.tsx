import { cx } from '../../../cx'
import './Segmented.css'

export type SegmentedOption<V extends string> = { value: V; label: string; disabled?: boolean }

export type SegmentedProps<V extends string> = {
  options: SegmentedOption<V>[]
  value: V
  onChange: (value: V) => void
  /** 그룹의 접근성 이름 (예: 시간 범위) */
  'aria-label'?: string
  className?: string
}

/**
 * Figma Segmented — 배타적 선택 3~5개를 한 줄로 (시간 범위 · 보기 모드). 항목이 5개를 넘으면 Select.
 * 활성 항목(Figma Segmented/Item Active=true)은 accent/soft 배경 + accent/strong 글자.
 * 배타적 단일 선택이라 radiogroup / radio 시맨틱을 쓴다. 모든 항목이 Tab 으로 닿는다.
 */
export function Segmented<V extends string>({ options, value, onChange, className, ...rest }: SegmentedProps<V>) {
  return (
    <div role="radiogroup" className={cx('ds-segmented', className)} {...rest}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            className={cx('ds-segmented__item', active && 'ds-segmented__item--active', active ? 'text-body-13-strong' : 'text-body-13')}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
