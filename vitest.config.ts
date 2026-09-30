import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// 테스트는 브라우저 없이 Node 에서 돈다. 화면 그리기가 아니라 계산 · API 약속을 확인하는 테스트라 jsdom 이 필요 없다.
// API 주소는 브라우저에서는 '/api/v1'(상대 주소)이지만 Node 의 fetch 는 절대 주소만 받아서 여기서 바꿔 준다
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      env: { VITE_API_BASE: 'http://localhost/api/v1' },
    },
  }),
)
