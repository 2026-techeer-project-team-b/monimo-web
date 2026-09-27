import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listApplications, type Application } from '@/api'
import { Card } from '@/design-system'
import { useServiceName } from '@/stores'
import { AccountCard } from './AccountCard'
import { AgentAttachCard } from './AgentAttachCard'
import { AppDeleteModal, AppFormModal } from './AppModals'
import { SamplingCard } from './SamplingCard'
import { ServiceDetail } from './ServiceDetail'
import { ServiceTable } from './ServiceTable'
import { useSettingsParams } from './useSettingsParams'
import './Settings.css'

type Dialog = { kind: 'create' } | { kind: 'edit'; app: Application } | { kind: 'delete'; app: Application } | null

/** 설정 (S09) — 왼쪽 감시 대상 서비스 표, 오른쪽 고른 서비스의 상세 · 샘플링률 · 에이전트 부착, 맨 아래 내 계정 */
export function SettingsPage() {
  const serviceName = useServiceName()
  const { appId, selectApp } = useSettingsParams()
  const apps = useQuery({ queryKey: ['applications'], queryFn: listApplications, staleTime: 5 * 60_000 })
  // 주소의 서비스 → 상단바에서 고른 서비스 → 첫 서비스
  const selected = apps.data?.find((a) => a.application_uuid === appId) ?? apps.data?.find((a) => a.name === serviceName) ?? apps.data?.[0]
  const [dialog, setDialog] = useState<Dialog>(null)

  return (
    <div className="st-page">
      <ServiceTable apps={apps.data} isError={apps.isError} selectedId={selected?.application_uuid ?? null} onSelect={selectApp} onCreate={() => setDialog({ kind: 'create' })} />
      <div className="st-main">
        {selected ? (
          <>
            <ServiceDetail appId={selected.application_uuid} onEdit={() => setDialog({ kind: 'edit', app: selected })} onDelete={() => setDialog({ kind: 'delete', app: selected })} />
            {/* 서비스를 바꾸면 입력 중이던 샘플링률 · 충돌 안내를 버린다 */}
            <SamplingCard key={selected.application_uuid} appId={selected.application_uuid} />
            <AgentAttachCard serviceName={selected.name} />
          </>
        ) : (
          <Card>
            <p className="st-empty text-body-13" role="status">
              {apps.data ? '왼쪽에서 서비스를 고르세요.' : '불러오는 중…'}
            </p>
          </Card>
        )}
        <AccountCard />
      </div>

      {dialog?.kind === 'create' || dialog?.kind === 'edit' ? (
        <AppFormModal
          app={dialog.kind === 'edit' ? dialog.app : null}
          onClose={() => setDialog(null)}
          onSaved={(a) => {
            setDialog(null)
            selectApp(a.application_uuid)
          }}
        />
      ) : null}
      {dialog?.kind === 'delete' ? (
        <AppDeleteModal
          app={dialog.app}
          onClose={() => setDialog(null)}
          onDeleted={() => {
            setDialog(null)
            selectApp(null)
          }}
        />
      ) : null}
    </div>
  )
}
