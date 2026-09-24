import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/design-system'
import { App } from '@/app/App'

/** 개발 서버 + VITE_API_MOCK=true 일 때만 가짜 응답(MSW)을 켠다. 빌드 결과물에는 들어가지 않는다 */
async function startMocks() {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCK !== 'true') return
  const { worker } = await import('@/api/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

startMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
