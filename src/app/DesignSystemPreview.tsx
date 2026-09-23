// 디자인 시스템 미리보기. Figma 05-A 섹션과 눈으로 대조하는 용도. 라우터가 생기면 /design-system 경로로 옮긴다.
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Field,
  IconAlerts,
  IconError,
  IconInspector,
  IconLogs,
  IconPlatform,
  IconServerMap,
  IconPlus,
  IconSettings,
  IconTransactions,
  Input,
  Pagination,
  Segmented,
  Select,
  Sidebar,
  SidebarStatusCard,
  Slider,
  StatusBadge,
  StatusDot,
  Switch,
  Tabs,
  Textarea,
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
  const [range, setRange] = useState('1h')
  const [tab, setTab] = useState('overview')
  const [chips, setChips] = useState<Record<string, boolean>>({ all: true, ok: true, warn: false, crit: false })
  const [ratio, setRatio] = useState(60)
  const [page, setPage] = useState(1)
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

      <h1 className="text-title-20" style={{ marginBottom: 'var(--space-5)' }}>05-B 확장 컴포넌트 (1/2)</h1>

      <div style={row}>
        <Button variant="primary" icon={<IconPlus />}>새 규칙</Button>
        <Button variant="primary" size="lg" icon={<IconPlus />}>새 규칙</Button>
        <Button variant="secondary" size="lg" icon={<IconSettings />}>설정</Button>
        <Button variant="danger" size="lg">삭제</Button>
        <Button variant="primary" disabled icon={<IconPlus />}>비활성</Button>
      </div>

      <div style={row}>
        {TONES.map((t) => <StatusBadge key={t} tone={t}>FIRING</StatusBadge>)}
      </div>

      <div style={row}>
        {(['all', 'ok', 'warn', 'crit'] as const).map((k) => (
          <Chip key={k} tone={k === 'all' ? 'default' : k} selected={chips[k]} onChange={(v) => setChips({ ...chips, [k]: v })}>
            {k === 'all' ? '전체' : k.toUpperCase()}
          </Chip>
        ))}
      </div>

      <div style={row}>
        <Segmented
          aria-label="시간 범위"
          value={range}
          onChange={setRange}
          options={['5m', '15m', '1h', '6h', '24h', '사용자 지정'].map((v) => ({ value: v, label: v }))}
        />
        <Tabs
          aria-label="트랜잭션 보기"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'overview', label: '개요' },
            { value: 'spans', label: '스팬 타임라인' },
            { value: 'sql', label: 'SQL · 로그' },
          ]}
        />
      </div>

      <div style={{ ...row, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox defaultChecked>SLACK 채널로 보내기</Checkbox>
          <Checkbox>이메일로 보내기</Checkbox>
          <Checkbox disabled>비활성</Checkbox>
        </div>
        <Textarea defaultValue="경보 발생 시 담당자에게 전달할 메모를 적습니다." />
        <Slider value={ratio} onChange={setRatio} aria-label="샘플링 비율" />
      </div>

      <div style={{ ...row, alignItems: 'flex-start' }}>
        <Field label="임계값 (ms)" htmlFor="f-threshold" help="P95 기준으로 이 값을 넘으면 경보가 발생합니다.">
          <Input id="f-threshold" defaultValue="500" />
        </Field>
        <Field label="임계값 (ms)" htmlFor="f-threshold-err" error="값을 입력해 주세요. 1 이상의 정수만 됩니다.">
          <Input id="f-threshold-err" aria-invalid />
        </Field>
        <Pagination start={(page - 1) * 20 + 1} end={Math.min(page * 20, 184)} total={184} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
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
            <Segmented aria-label="시간 범위" value={range} onChange={setRange} options={['5m', '15m', '1h', '6h', '24h'].map((v) => ({ value: v, label: v }))} />
            <Button variant="secondary">30s</Button>
            <Badge tone="accent">ADMIN</Badge>
          </Topbar>
        </div>
      </div>
    </div>
  )
}
