// 앱 뼈대. 라우터 · TanStack Query 연결은 쓰는 화면이 생길 때 여기에 붙인다.
export function App() {
  return (
    <main style={{ padding: 'var(--space-5)' }}>
      <h1 className="text-title-20">MONIMO</h1>
      <p className="text-body-13" style={{ color: 'var(--color-text-tertiary)' }}>
        화면은 src/features/ 에서, 공통 부품은 src/design-system/ 에서 만든다.
      </p>
    </main>
  )
}
