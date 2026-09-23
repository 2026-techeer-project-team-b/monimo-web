import type { HTMLAttributes } from 'react'
import { cx } from '../../../cx'
import './CodeBlock.css'

export type CodeBlockProps = HTMLAttributes<HTMLPreElement>

/**
 * Figma CodeBlock — 어두운 배경(bg/sidebar) + Mono/12 · text/on-dark. 줄바꿈을 그대로 살린다.
 * 스택 트레이스 · 웹훅 JSON · SQL 원문. 한 줄 ID 는 표의 mono 셀.
 */
export function CodeBlock({ className, children, ...rest }: CodeBlockProps) {
  return (
    <pre className={cx('ds-code-block', 'text-mono-12', className)} {...rest}>
      <code>{children}</code>
    </pre>
  )
}
