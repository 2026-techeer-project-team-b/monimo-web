import type { InputHTMLAttributes } from 'react'
import { cx } from '../../../cx'
import './Input.css'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

/**
 * 단일 행 텍스트 입력. 검색어 · 임계값 · 채널 주소처럼 짧은 값을 받는다.
 * 라벨 · 오류 문구가 필요하면 (05-B) Field 로 감싼다. 폭은 부모가 정한다 (기본 200).
 */
export function Input({ className, ...rest }: InputProps) {
  return <input className={cx('ds-input', 'text-body-13', className)} {...rest} />
}
