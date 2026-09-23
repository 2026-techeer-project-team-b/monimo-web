import type { CSSProperties, InputHTMLAttributes } from 'react'
import { cx } from '../../../cx'
import './Slider.css'

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max' | 'step'> & {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** 눈금 아래 라벨. 없으면 min~max 를 5칸으로 나눈 값 */
  ticks?: string[]
}

/**
 * Figma Slider — 구간 값 선택 (눈금 5칸). 샘플링 비율 · 히트맵 농도처럼 대략적인 값.
 * 정확한 수치가 중요하면 Input · Field 를 같이 둔다. 네이티브 <input type="range"> 기반.
 */
export function Slider({ value, onChange, min = 0, max = 100, step = 1, ticks, className, style, ...rest }: SliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  const labels = ticks ?? Array.from({ length: 5 }, (_, i) => String(Math.round(min + ((max - min) * i) / 4)))
  return (
    <div className={cx('ds-slider', className)} style={{ ...style, '--ds-slider-pct': `${pct}%` } as CSSProperties}>
      <input
        type="range"
        className="ds-slider__input"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        {...rest}
      />
      <div aria-hidden className="ds-slider__ticks">
        {labels.map((_, i) => <span key={i} className="ds-slider__tick" />)}
      </div>
      <div aria-hidden className="ds-slider__labels text-mono-11">
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </div>
  )
}
