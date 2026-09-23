import { useRef, type KeyboardEvent } from 'react'
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
 * 키보드: 활성 탭에 포커스 후 ← → Home End 로 이동한다 (WAI-ARIA tabs 패턴).
 * 탭 패널은 화면이 `role="tabpanel"` + `aria-labelledby="tab-<value>"` 로 연결한다.
 */
export function Tabs<V extends string>({ items, value, onChange, className, ...rest }: TabsProps<V>) {
  const refs = useRef<Partial<Record<V, HTMLButtonElement | null>>>({})

  function move(e: KeyboardEvent<HTMLDivElement>) {
    const enabled = items.filter((t) => !t.disabled)
    if (enabled.length === 0) return
    const idx = enabled.findIndex((t) => t.value === value)
    let next: TabItem<V> | undefined
    if (e.key === 'ArrowRight') next = enabled[(idx + 1) % enabled.length]
    else if (e.key === 'ArrowLeft') next = enabled[(idx - 1 + enabled.length) % enabled.length]
    else if (e.key === 'Home') next = enabled[0]
    else if (e.key === 'End') next = enabled[enabled.length - 1]
    if (!next) return
    e.preventDefault()
    onChange(next.value)
    refs.current[next.value]?.focus()
  }

  return (
    <div role="tablist" className={cx('ds-tabs', className)} onKeyDown={move} {...rest}>
      {items.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[t.value] = el
            }}
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
