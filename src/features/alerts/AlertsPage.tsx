import { AdminOnly } from '@/auth'
import { Button, IconPlus, Tabs } from '@/design-system'
import { ChannelsTab } from './ChannelsTab'
import { EventsTab } from './EventsTab'
import { RulesTab } from './RulesTab'
import { useAlertParams, type AlertTab } from './useAlertParams'
import './Alerts.css'

/** 경보 (S08) — 이벤트 · 규칙 · 채널 탭. 탭은 주소 tab= 에 둔다 */
export function AlertsPage() {
  const { tab, setTab, openRule, openChannel } = useAlertParams()
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
        {tab === 'events' ? null : (
          <AdminOnly>
            <Button variant="primary" icon={<IconPlus size={16} />} onClick={() => (tab === 'rules' ? openRule('new') : openChannel('new'))}>
              {tab === 'rules' ? '규칙 만들기' : '채널 등록'}
            </Button>
          </AdminOnly>
        )}
      </div>
      {tab === 'events' ? (
        <EventsTab />
      ) : tab === 'rules' ? (
        <RulesTab />
      ) : (
        <ChannelsTab />
      )}
    </div>
  )
}
