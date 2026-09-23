import type { ReactNode, SVGProps } from 'react'

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /** 한 변 px. 기본 16 (--size-icon) */
  size?: number
  /** 의미가 있는 아이콘이면 접근성 이름. 없으면 장식으로 취급해 aria-hidden */
  title?: string
}

/*
 * 모든 아이콘의 공통 틀. 16px 격자 · stroke 1.75 · round cap/join.
 * 색은 currentColor 라서 부모 글자색(text/primary 또는 상태색 변수)을 그대로 받는다.
 */
export function IconBase({ size = 16, title, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}
