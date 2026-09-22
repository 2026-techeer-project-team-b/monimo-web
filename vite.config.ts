import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // 로컬에서 api-server(8080)를 켜 두면 /api 요청을 그쪽으로 넘긴다
    proxy: { '/api': 'http://localhost:8080' },
  },
})
