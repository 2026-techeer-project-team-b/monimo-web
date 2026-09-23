// 07 패턴 (Patterns) — Figma 「디자인 시스템」 07 섹션과 1:1.
//
// 여러 화면에서 반복되는 화면 조각의 조립 규칙. 부품(05 · 06)을 정해진 배치로 묶는다.
// 예: PageHeader(제목 + 액션) · FilterBar(기간 · 서비스 선택) · EmptyState · ErrorBanner · LoadingState · StatusDot + 라벨 · KeyValueList
//
// 규칙 (공통 규칙은 README 「폴더 구성」 표)
// - 패턴은 레이아웃과 슬롯만 정한다. 실제 데이터 · 이벤트 처리는 화면(features)이 props 로 넣는다.
// - 05 · 06 부품과 tokens/ 만 가져다 쓴다.
// - 패턴을 만들면 아래에 export 를 한 줄씩 추가한다.
//   export { PageHeader } from './PageHeader'
export {}
