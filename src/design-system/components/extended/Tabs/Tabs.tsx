import { cx } from '../../../cx'
import './Tabs.css'

export type TabItem<V extends string> = { value: V; label: string; disabled?: boolean }

export type TabsProps<V extends string> = {
  items: TabItem<V>[]
  value: V
  onChange: (value: V) => void
  /** 탭 목록의 접근성 이름 */
  'aria-label'?: string
  className?: string
}

/**
 * Figma Tabs — 밑줄형 탭. 같은 대상의 여러 보기를 전환한다 (개요 · 스팬 타임라인 · SQL/로그).
 * 활성 항목(Tabs/Item Active=true)은 accent/strong 글자 + 2px accent/default 밑줄. 화면 이동은 사이드바.
 * 탭 패널은 화면이 `role="tabpanel"` + `aria-labelledby` 로 연결한다.
 */
export function Tabs<V extends string>({ items, value, onChange, className, ...rest }: TabsProps<V>) {
  return (
    <div role="tablist" className={cx('ds-tabs', className)} {...rest}>
      {items.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            id={`tab-${t.value}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={t.disabled}
            className={cx('ds-tabs__item', active && 'ds-tabs__item--active', active ? 'text-body-13-strong' : 'text-body-13')}
            onClick={() => onChange(t.value)}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
