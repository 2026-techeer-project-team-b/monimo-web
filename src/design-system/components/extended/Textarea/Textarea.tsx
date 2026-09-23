import type { TextareaHTMLAttributes } from 'react'
import { cx } from '../../../cx'
import './Textarea.css'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

/**
 * Figma Textarea — 여러 줄 입력 (높이 80 · 폭은 부모가 정한다, 기본 320). 경보 메모 · 웹훅 페이로드 템플릿.
 * 한 줄 값은 Input, 라벨 · 오류가 필요하면 Field 로 감싼다.
 */
export function Textarea({ className, ...rest }: TextareaProps) {
  return <textarea className={cx('ds-textarea', 'text-body-13', className)} {...rest} />
}
