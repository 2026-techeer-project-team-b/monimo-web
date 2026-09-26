import { AdminOnly } from '@/auth'
import { Button, Card, IconPlus, Tabs } from '@/design-system'
import { EventsTab } from './EventsTab'
import { RulesTab } from './RulesTab'
import { useAlertParams, type AlertTab } from './useAlertParams'
import './Alerts.css'

/** 경보 (S08) — 이벤트 · 규칙 · 채널 탭. 탭은 주소 tab= 에 둔다 */
export function AlertsPage() {
  const { tab, setTab, openRule } = useAlertParams()
  return (
    <div className="al-page">
      <div className="al-tabs">
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
        {tab === 'rules' ? (
          <AdminOnly>
            <Button variant="primary" icon={<IconPlus size={16} />} onClick={() => openRule('new')}>
              규칙 만들기
            </Button>
          </AdminOnly>
        ) : null}
      </div>
      {tab === 'events' ? (
        <EventsTab />
      ) : tab === 'rules' ? (
        <RulesTab />
      ) : (
        <Card title="채널">
          <p className="al-empty text-body-13">알림 채널 화면은 5단계-3 에서 만듭니다.</p>
        </Card>
      )}
    </div>
  )
}
