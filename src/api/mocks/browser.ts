import { setupWorker } from 'msw/browser'
import { handlers, mockControls } from './handlers'

export const worker = setupWorker(...handlers)

// 개발 중 흐름 시험용: 브라우저 콘솔에서 __monimoMock.expireAccess() · __monimoMock.revokeRefresh()
;(globalThis as { __monimoMock?: typeof mockControls }).__monimoMock = mockControls
