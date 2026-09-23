// 05-B 확장 컴포넌트 (Components · Extended) — Figma 「디자인 시스템」 05-B 섹션(노드 557:2577)과 1:1.
//
// 05-A 기본 부품을 조합 · 확장한 상위 부품. 부품 하나 = 폴더 하나.
//
// 규칙 (공통 규칙은 README 「폴더 구성」 표)
// - 05-A 기본 부품과 tokens/ · icons/ 만 가져다 쓴다.
// - 데이터 모양(행 · 컬럼 · 옵션)은 제네릭 props 로 받고, 도메인 타입(트레이스 · 서비스 등)을 여기서 정의하지 않는다.
// - Figma Button/Icon 은 05-A Button 의 `icon` · `size` prop 으로, NavItem 은 Sidebar 안에 들어 있다.
// - 부품을 만들면 아래에 export 를 한 줄씩 추가한다.

export { StatusBadge } from './StatusBadge'
export type { StatusBadgeProps } from './StatusBadge'
export { Chip } from './Chip'
export type { ChipProps, ChipTone } from './Chip'
export { Segmented } from './Segmented'
export type { SegmentedOption, SegmentedProps } from './Segmented'
export { Tabs } from './Tabs'
export type { TabItem, TabsProps } from './Tabs'
export { Checkbox } from './Checkbox'
export type { CheckboxProps } from './Checkbox'
export { Textarea } from './Textarea'
export type { TextareaProps } from './Textarea'
export { Slider } from './Slider'
export type { SliderProps } from './Slider'
export { Field } from './Field'
export type { FieldProps } from './Field'
export { Pagination } from './Pagination'
export type { PaginationProps } from './Pagination'
