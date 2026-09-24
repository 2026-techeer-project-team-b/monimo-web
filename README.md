# monimo-web

모니모니터링 화면 (서버맵 · 스캐터 · 콜트리 · 인스펙터 · 규칙/설정)

- 기술: React 19 · TypeScript · Vite · oxlint
- 나중에 넣을 것: Zustand (여러 화면이 같이 쓰는 값) · TanStack Query (서버 데이터). 쓰는 화면이 생길 때 설치한다
- 상태: 뼈대만 있음 (디자인 토큰까지)

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
├── features/        화면 하나 = 폴더 하나 (server-map · scatter · call-tree ...)
├── api/             API 호출 + 가짜 응답
├── stores/          여러 화면이 같이 쓰는 값 (Zustand)
├── app/             앱 뼈대 (라우터 · TanStack Query 연결 자리)
└── main.tsx
```

| 규칙 | 지키는 방법 |
|---|---|
| `design-system` 은 `features` · `api` · `stores` · `app` 을 가져다 쓰지 않는다 | `npm run lint` 가 막는다 (`.oxlintrc.json`) |
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

## 환경변수

실제 값은 레포에 올리지 않는다. `.env.example` 에 이름만 적는다.

| 이름 | 설명 |
|---|---|
| `VITE_API_BASE` | API 주소 앞부분 (기본 `/api/v1`) |

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
