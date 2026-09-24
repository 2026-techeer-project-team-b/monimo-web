// 가짜 응답 목록 (MSW). VITE_API_MOCK=true 로 개발 서버를 켰을 때만 쓴다.
// 화면 작업에서 필요한 엔드포인트를 여기에 추가한다. 응답 모양은 백엔드 명세(monimo-backend docs/design)를 따른다.
import { http, HttpResponse } from 'msw'
import { API_BASE } from '../client'

export const handlers = [
  // 예시: 연결 확인용
  http.get(`${API_BASE}/health`, () => HttpResponse.json({ status: 'UP' })),
]
