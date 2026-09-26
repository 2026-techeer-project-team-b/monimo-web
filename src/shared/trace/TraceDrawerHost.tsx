import { Suspense, type ComponentType } from 'react'
import { Drawer } from '@/design-system'
import { useOpenTrace, useOpenTraceId } from './useOpenTrace'
import './TraceDrawer.css'

export type TraceBodyProps = { traceId: string }

/**
 * 주소에 `?trace=` 가 있으면 넓은 드로어로 트레이스 상세를 연다. 앱 셸(AppLayout)에 한 번만 둔다.
 * 본문(Body)은 화면 코드(features/trace-detail)라 shared 가 직접 가져오지 않고 prop 으로 받는다.
 * Body 는 모듈 최상단에서 lazy 로 한 번 만든 것을 넘겨야 한다 — 렌더마다 새로 만들면 자동 새로고침 때 본문이 다시 마운트돼 펼친 트리가 접힌다
 */
export function TraceDrawerHost({ Body }: { Body: ComponentType<TraceBodyProps> }) {
  const traceId = useOpenTraceId()
  const { close } = useOpenTrace()
  return (
    <Drawer open={!!traceId} onClose={close} title="트레이스 상세" className="trace-drawer">
      <Suspense fallback={<p className="trace-drawer__loading text-body-13">불러오는 중…</p>}>
        {/* 다른 트레이스를 열면 본문 상태(펼침 · 선택)를 처음부터 */}
        {traceId ? <Body key={traceId} traceId={traceId} /> : null}
      </Suspense>
    </Drawer>
  )
}
