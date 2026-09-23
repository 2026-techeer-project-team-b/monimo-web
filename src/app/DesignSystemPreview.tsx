// 디자인 시스템 미리보기. Figma 05-A 섹션과 눈으로 대조하는 용도. 라우터가 생기면 /design-system 경로로 옮긴다.
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  IconAlerts,
  IconError,
  IconInspector,
  IconLogs,
  IconPlatform,
  IconServerMap,
  IconSettings,
  IconTransactions,
  Input,
  Select,
  Sidebar,
  SidebarStatusCard,
  StatusDot,
  Switch,
  Topbar,
  type Tone,
} from '@/design-system'

const TONES: Tone[] = ['ok', 'warn', 'crit', 'muted', 'accent']

const NAV = [
  { key: 'server-map', label: '서버맵', icon: <IconServerMap /> },
  { key: 'transactions', label: '트랜잭션', icon: <IconTransactions /> },
  { key: 'inspector', label: '인스펙터', icon: <IconInspector /> },
  { key: 'error', label: '에러', icon: <IconError /> },
  { key: 'logs', label: '로그', icon: <IconLogs /> },
  { key: 'alerts', label: '경보', icon: <IconAlerts />, count: 3 },
  { key: 'settings', label: '설정', icon: <IconSettings /> },
  { key: 'platform', label: '플랫폼 상태', icon: <IconPlatform /> },
]

export function DesignSystemPreview() {
  const [on, setOn] = useState(true)
  const [active, setActive] = useState('server-map')
  const row = { display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-5)' } as const

  return (
    <div style={{ padding: 'var(--space-5)' }}>
      <h1 className="text-title-20" style={{ marginBottom: 'var(--space-5)' }}>05-A 기본 컴포넌트</h1>

      <div style={row}>
        <Button variant="primary">버튼</Button>
        <Button variant="secondary">버튼</Button>
        <Button variant="danger">버튼</Button>
        <Button variant="secondary" icon={<IconSettings />}>아이콘 버튼</Button>
        <Button variant="primary" disabled>비활성</Button>
      </div>

      <div style={row}>
        {TONES.map((t) => <Badge key={t} tone={t}>LABEL</Badge>)}
      </div>

      <div style={row}>
        {TONES.map((t) => <StatusDot key={t} tone={t} />)}
      </div>

      <div style={row}>
        <Input defaultValue="값" />
        <Input placeholder="플레이스홀더" />
        <Select defaultValue="all" aria-label="범위">
          <option value="all">전체</option>
          <option value="shop-order">shop-order</option>
        </Select>
        <Switch checked={on} onChange={setOn} aria-label="토글" />
        <Switch checked={false} aria-label="꺼짐" />
      </div>

      <div style={row}>
        <Card title="카드 제목" style={{ width: 320 }} />
        <Card title="액션 있는 카드" actions={<Button>내보내기</Button>} style={{ width: 360 }}>
          <p className="text-body-13" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>본문 내용</p>
        </Card>
      </div>

      <div style={{ display: 'flex', height: 960, border: '1px solid var(--color-border-default)' }}>
        <Sidebar
          items={NAV}
          activeKey={active}
          onSelect={setActive}
          footer={<SidebarStatusCard title="파수꾼 · 카나리" tone="ok" value="12초 전" caption="정상 (기준 60초)" />}
        />
        <div style={{ flex: 1, background: 'var(--color-bg-canvas)' }}>
          <Topbar title="서버맵" subtitle="서비스 간 호출 관계와 에러를 한눈에">
            <span className="text-caption-12" style={{ color: 'var(--color-text-tertiary)' }}>서비스</span>
            <Select defaultValue="shop-order" aria-label="서비스">
              <option value="shop-order">shop-order</option>
            </Select>
            <Button variant="secondary">30s</Button>
            <Badge tone="accent">ADMIN</Badge>
          </Topbar>
        </div>
      </div>
    </div>
  )
}
