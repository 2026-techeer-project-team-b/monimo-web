// 05-A 기본 컴포넌트 (Components · Base) — Figma 「디자인 시스템」 05-A 섹션(노드 538:2)과 1:1.
//
// 화면 15장이 실제로 쓰는 가장 작은 부품. 부품 하나 = 폴더 하나 (Button/Button.tsx · Button.css · index.ts).
//
// 규칙 (공통 규칙은 README 「폴더 구성」 표)
// - 변형(variant · tone · state)은 Figma 컴포넌트 속성 이름과 값을 그대로 쓴다.
// - 글자는 02 텍스트 스타일 클래스를 JSX 에서 붙이고, 색 · 간격 · 반경 · 그림자는 CSS 에서 토큰 변수만 쓴다.
//   Figma 에만 있고 03 토큰에 없는 부품 내부 치수(버튼 좌우 14 등)는 CSS 에 px 로 두고 `Figma 값` 주석을 단다.
// - 부품을 만들면 아래에 export 를 한 줄씩 추가한다.

export { Button } from './Button'
export type { ButtonProps, ButtonVariant } from './Button'
export { Badge } from './Badge'
export type { BadgeProps, Tone } from './Badge'
export { StatusDot } from './StatusDot'
export type { StatusDotProps } from './StatusDot'
export { Input } from './Input'
export type { InputProps } from './Input'
export { Select } from './Select'
export type { SelectProps } from './Select'
export { Switch } from './Switch'
export type { SwitchProps } from './Switch'
export { Card } from './Card'
export type { CardProps } from './Card'
export { Sidebar, SidebarStatusCard } from './Sidebar'
export type { SidebarItem, SidebarProps, SidebarStatusCardProps } from './Sidebar'
export { Topbar } from './Topbar'
export type { TopbarProps } from './Topbar'
