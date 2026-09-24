// 06 패턴 (Patterns) — Figma 「디자인 시스템」 06 섹션(노드 553:8)과 1:1.
//
// 화면을 만들 때 반복해서 지키는 조립 규칙 6가지. 새 부품이 아니라 05 부품을 정해진 배치로 묶는 틀과 규칙 함수다.
//   P1 앱 셸        AppShell · PageGrid · PageGridItem
//   P2 카드 · 표    TableCard · CursorPager · formatTime · shortId
//   P3 레이어링     ToastViewport · DRAWER_SAFE_WIDTH (레이어 순서 자체는 03 layer 토큰)
//   P4 상태색       alertStateTone · severityTone · podStatusTone · httpStatusTone · notifyResultTone · channelTypeTone
//   P5 차트         chartTheme · heatmapLevel · serviceColor
//   P6 폼           FormCard
//
// 규칙 (공통 규칙은 README 「폴더 구성」 표)
// - 패턴은 레이아웃과 슬롯만 정한다. 실제 데이터 · 이벤트 처리는 화면(features)이 props 로 넣는다.
// - 05 부품과 tokens/ · icons/ 만 가져다 쓴다.

export { AppShell, PageGrid, PageGridItem } from './AppShell'
export type { AppShellProps, PageGridProps, PageGridItemProps } from './AppShell'
export { TableCard, CursorPager, formatTime, shortId } from './TableCard'
export type { TableCardProps, CursorPagerProps } from './TableCard'
export { ToastViewport, DRAWER_SAFE_WIDTH } from './ToastViewport'
export type { ToastViewportProps } from './ToastViewport'
export { alertStateTone, severityTone, podStatusTone, httpStatusTone, notifyResultTone, channelTypeTone } from './statusTone'
export { chartTheme, heatmapLevel, serviceColor } from './chart'
export { FormCard } from './FormCard'
export type { FormCardProps } from './FormCard'
