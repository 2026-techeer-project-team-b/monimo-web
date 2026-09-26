import { Card, Tabs } from '@/design-system'
import { EventsTab } from './EventsTab'
import { useAlertParams, type AlertTab } from './useAlertParams'
import './Alerts.css'

/** 경보 (S08) — 이벤트 · 규칙 · 채널 탭. 탭은 주소 tab= 에 둔다 */
export function AlertsPage() {
  const { tab, setTab } = useAlertParams()
  return (
    <div className="al-page">
      <Tabs<AlertTab>
        aria-label="경보"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'events', label: '경보 이벤트' },
          { value: 'rules', label: '규칙' },
          { value: 'channels', label: '채널' },
        ]}
      />
      {tab === 'events' ? (
        <EventsTab />
      ) : (
        <Card title={tab === 'rules' ? '규칙' : '채널'}>
          <p className="al-empty text-body-13">{tab === 'rules' ? '경보 규칙 화면은 다음 작업(5단계-2)에서 만듭니다.' : '알림 채널 화면은 5단계-3 에서 만듭니다.'}</p>
        </Card>
      )}
    </div>
  )
}
