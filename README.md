# monimo-web

모니모니터링 화면 (서버맵 · 트랜잭션 · 인스펙터 · 에러 · 로그 · 경보 · 설정 · 플랫폼 상태)

- 기술: React 19 · TypeScript · Vite · oxlint · React Router · TanStack Query · Zustand · ECharts · React Flow · MSW(가짜 응답)
- 상태: 디자인 시스템 · 앱 기반(경로 · 셸 · API 클라이언트) · 로그인 · 권한 · 상단바 공통 상태 완료 · 화면은 빈 페이지

## 폴더 구성

**디자인 시스템에서 부품을 만들고, 화면(features)에서 조립한다.**

```
src/
├── design-system/   공통 부품 공장 (화면을 모른다). Figma 「디자인 시스템」 섹션 01~06 과 1:1
│   ├── tokens/
│   │   ├── color.css       01 색 (의미 색 34 + 원시 색 29)
│   │   ├── typography.css  02 타이포그래피 (서체 변수 + 텍스트 스타일 클래스)
│   │   ├── layout.css      03 간격 · 반경 · 그림자 · 크기
│   │   └── base.css        공통 바탕 (reset · body)
│   ├── icons/              04 아이콘 (SVG 를 감싼 컴포넌트)
│   ├── components/
│   │   ├── base/           05-A 기본 컴포넌트: Button · Badge · Input · Sidebar ...
│   │   └── extended/       05-B 확장 컴포넌트: Table · Tabs · Modal ...
│   ├── patterns/           06 패턴: AppShell · TableCard · FormCard · 상태색 · 차트 규칙
│   └── index.ts            입구. 밖에서는 '@/design-system' 으로만 가져다 쓴다
├── features/        화면 하나 = 폴더 하나 = 경로 하나 (아래 「화면 경로」 표)
├── api/             API 호출 (client.ts · auth.ts · tokens.ts) + 가짜 응답 (mocks/)
├── auth/            로그인 상태 · 라우트 가드 · 역할 (useAuth · RequireAuth · AdminOnly)
├── shared/          여러 화면이 같이 쓰는 앱 코드: 차트 공용 틀(charts/EChart) 등
├── stores/          여러 화면이 같이 쓰는 값 (Zustand): 서비스 · 시간 범위 · 새로고침 주기
├── app/             앱 뼈대: 경로(routes.tsx) · 셸(AppLayout) · TanStack Query · 디자인 시스템 미리보기
└── main.tsx
```

| 규칙 | 지키는 방법 |
|---|---|
| `design-system` 은 `features` · `api` · `stores` · `app` · `shared` 를 가져다 쓰지 않는다 | `npm run lint` 가 막는다 (`.oxlintrc.json`) |
| `shared` 는 `features` · `app` 을 가져다 쓰지 않는다 | `npm run lint` 가 막는다 |
| 색 · 간격은 hex · px 를 직접 쓰지 않고 토큰 변수를 쓴다 | 예: `var(--color-accent-default)` · `var(--space-4)` |
| 글자는 Figma 텍스트 스타일 이름 클래스를 쓴다 | 예: `Body/13 Strong` → `.text-body-13-strong` |
| 토큰 값을 바꿀 때는 Figma 먼저, 그다음 `tokens/` 의 해당 파일 | 둘이 어긋나지 않게 |
| 화면에서는 의미 색(`--color-*`)만 쓴다. 원시 색(`--gray-500` 등) 직접 사용 금지 | `color.css` 의 두 층 구분 참고 |

## 로컬 실행

필요한 것: Node 24 (`.nvmrc`)

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint     # 코드 검사 (design-system 경계 포함)
npm run build    # 타입 검사 + 빌드
```

`/api` 로 시작하는 요청은 개발 서버가 `localhost:8080`(api-server)으로 넘긴다.

백엔드 없이 화면을 만들 때는 가짜 응답을 켠다. 응답은 `src/api/mocks/handlers.ts` 에 추가한다 (개발 서버에서만 동작, 빌드 결과물에는 안 들어감).

```bash
VITE_API_MOCK=true npm run dev
```

가짜 응답의 데모 계정 (비밀번호 모두 `monimo2026`): `admin@monimo.io` (ADMIN) · `viewer@monimo.io` (VIEWER).
브라우저 콘솔에서 `__monimoMock.expireAccess()` 는 토큰 만료(자동 재발급 시험), `__monimoMock.revokeRefresh()` 는 세션 만료를 흉내 낸다.

## 상단바 공통 상태 (서비스 · 시간 범위 · 새로고침)

상단바의 서비스 선택 · 시간 범위(5m · 15m · 1h · 6h · 24h · 사용자 지정) · 자동 새로고침 주기는 `src/stores/filters.ts` 한 곳에 있고 주소와 맞춰진다.
`?service=shop-order&range=1h&refresh=30` 처럼 링크를 공유하면 같은 화면이 열린다. 화면이 쓰는 다른 쿼리(예: `tab`)는 그대로 둔다.

화면에서는 이렇게 쓴다. 시간 창을 `queryKey` 에 넣으면 자동 새로고침 때마다 다시 불린다.

```tsx
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useServiceName, useTimeWindow } from '@/stores'

const serviceName = useServiceName() // null = 전체
const { from, to } = useTimeWindow() // UTC ISO, 명세 공통 파라미터 그대로
const { data } = useQuery({
  queryKey: ['server-map', serviceName, from, to],
  queryFn: () => api.get('/server-map', { query: { service_name: serviceName, from, to } }),
  placeholderData: keepPreviousData, // 새로고침 때 화면이 비지 않게
})
```

- 서비스가 꼭 필요한 문(`/traces/scatter` 등)인데 "전체"면 화면에서 "서비스를 선택하세요" 안내를 띄운다.
- 자동 새로고침은 탭이 숨겨지면 멈추고, 사용자 지정(고정 시각) 범위에서는 돌지 않는다.

## 차트

차트는 ECharts 를 `@/shared` 의 `EChart` 로만 그린다. 06 P5 차트 규약(축 글자 · 격자 · 툴팁)이 테마로 자동 적용된다.
캔버스는 CSS 변수를 못 읽으므로 색은 `chartColors()` 가 풀어 둔 값을 쓴다.

```tsx
import { chartColors, EChart } from '@/shared'

const c = chartColors()
<EChart
  aria-label="응답시간 스캐터"
  option={{ xAxis: { type: 'time' }, yAxis: { type: 'value' }, series: [{ type: 'scatter', itemStyle: { color: c.scatter.ok }, data }] }}
/>
```

- 히트맵은 `heatmapVisualMap()` · `heatmapStep()` 으로 06 P5 농도 5단계 + 에러 색을 칠한다.
- 새 차트 종류 · 부품(범례 · 확대 등)이 필요하면 `src/shared/charts/echarts.ts` 에 등록한다 (번들 크기 때문에 쓰는 것만).
- ECharts 는 `vendor-echarts` 파일로 떨어져 있고, 차트를 쓰는 화면에서만 내려받는다. 서버맵 그래프(React Flow)도 `vendor-xyflow` 로 따로 떨어진다.

## 로그인 · 권한

백엔드 명세(monimo-backend `docs/design/web-v2/api-spec.md` §0)를 따른다.

- `/login` 에서 로그인하면 access 토큰은 메모리, refresh 토큰은 localStorage 에 둔다. 모든 요청에 `Authorization: Bearer` 가 붙는다.
- 요청이 401 이면 refresh 로 한 번 재발급하고 다시 보낸다 (동시에 여러 개여도 재발급은 1번). 재발급도 실패하면 로그인 화면으로 가며 "세션 만료" 배너가 뜬다.
- 로그인하지 않고 화면 주소로 들어오면 `/login?next=<원래 주소>` 로 가고, 로그인 뒤 원래 주소로 돌아온다.
- 화면에서 역할은 `useAuth()` 의 `isAdmin`, ADMIN 전용 버튼은 `<AdminOnly>` 로 감싼다. **이건 화면을 가리는 편의 기능이고, 실제로 막는 것은 API 서버다.**
- API 응답은 명세 봉투(`{ data }` · `{ error: { code, message } }`)를 `api.get` 등이 벗겨서 돌려준다. 목록은 `api.getPage` 가 `{ items, nextCursor }` 로 준다.

## 화면 경로

화면 하나 = `src/features/<폴더>/` 하나 = 경로 하나. 경로 · 메뉴 · 상단바 제목은 `src/app/routes.tsx` 한 곳에서 정한다. 화면 코드는 경로별로 따로 내려받는다.

| 경로 | 화면 | 폴더 |
|---|---|---|
| `/server-map` (첫 화면) | 서버맵 | `features/server-map` |
| `/transactions` | 트랜잭션 (스캐터 · 목록 · 콜트리 드로어) | `features/transactions` |
| `/inspector` | 인스펙터 | `features/inspector` |
| `/errors` | 에러 | `features/errors` |
| `/logs` | 로그 | `features/logs` |
| `/alerts` | 경보 (이벤트 · 규칙 · 채널) | `features/alerts` |
| `/settings` | 설정 | `features/settings` |
| `/platform` | 플랫폼 상태 | `features/platform` |
| `/login` | 로그인 (셸 없음, 로그인 없이 들어감) | `features/login` |
| `/design-system` | 디자인 시스템 미리보기 (메뉴에 없음, 로그인 없이 들어감) | `app/DesignSystemPreview.tsx` |

화면 규칙

- API 는 `@/api` 의 `api.get` 등만 쓰고 fetch 를 직접 쓰지 않는다. 실패는 `ApiError(status · code · message)` 로 온다.
- 서버 데이터는 TanStack Query(`useQuery` · `useMutation`)로 가져온다.
- 부품 · 레이아웃 · 상태색은 `@/design-system` 에서 가져다 쓴다 (06 패턴: `TableCard` · `FormCard` · `severityTone` ...).

## 환경변수

실제 값은 레포에 올리지 않는다. `.env.example` 에 이름만 적는다.

| 이름 | 설명 |
|---|---|
| `VITE_API_BASE` | API 주소 앞부분 (기본 `/api/v1`) |
| `VITE_API_MOCK` | `true` 면 개발 서버에서 가짜 응답 사용 (기본 `false`) |

## 포트

| 서비스 | 포트 |
|---|---|
| 개발 서버 (Vite) | 5173 |
| api-server (monimo-backend) | 8080 |

## 관련 문서

- [설계 문서 (결정 기록 원본)](https://github.com/2026-techeer-project-team-b/monimo-backend/tree/main/docs/design): monimo-backend 레포의 `docs/design/`
- [레포별 파일 구성](https://app.notion.com/p/3e1d7d6851ff80a8a110e8aea0b5783b)
- [깃허브 레포지토리 규칙](https://app.notion.com/p/3dcd7d6851ff8000b795f1cc609124e6)

## 기여 규칙

- `main` 직접 push 금지, PR로만 머지
- 브랜치: `feat/<이슈번호>-<설명>` · `fix/<이슈번호>-<설명>` · `chore/<설명>`
- 커밋: `<타입>(<범위>): <요약>` (타입: feat · fix · docs · chore · refactor · test)
