// 디자인 시스템 입구. 화면 코드는 여기로만 가져다 쓴다.
//   import { Button } from '@/design-system'
// 구성은 Figma 「디자인 시스템」 섹션 순서(01~06)와 같다. 각 파일 머리 주석에 추가 규칙이 있다.

import './tokens/color.css'      /* 01 색 */
import './tokens/typography.css' /* 02 타이포그래피 */
import './tokens/layout.css'     /* 03 간격 · 반경 · 그림자 */
import './tokens/base.css'       /* 공통 바탕 (토큰 다음에 온다) */

export * from './icons'               /* 04 아이콘 */
export * from './components/base'     /* 05-A 기본 컴포넌트 */
export * from './components/extended' /* 05-B 확장 컴포넌트 */
export * from './patterns'            /* 06 패턴 */
