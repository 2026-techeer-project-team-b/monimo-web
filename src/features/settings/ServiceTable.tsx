import type { Application } from '@/api'
import { AdminOnly } from '@/auth'
import { Button, formatTime, IconPlus, Table, TableBody, TableCard, TableCell, TableHead, TableHeaderCell, TableRow } from '@/design-system'

type Props = {
  apps: Application[] | undefined
  isError: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
}

const short = (iso?: string) => (iso ? `${new Date(iso).toLocaleDateString('sv-SE').slice(5)} ${formatTime(iso).slice(0, 5)}` : '—')

/** 왼쪽 감시 대상 서비스 표 — 누르면 오른쪽이 그 서비스로 바뀐다. 파드 수는 목록 응답에 없어 상세에서 보여 준다 */
export function ServiceTable({ apps, isError, selectedId, onSelect, onCreate }: Props) {
  return (
    <TableCard
      className="st-apps"
      title={
        <span className="st-title">
          감시 대상 서비스 <span className="text-mono-11 st-muted">GET /applications{apps ? ` · ${apps.length}건` : ''}</span>
        </span>
      }
      actions={
        <AdminOnly>
          <Button icon={<IconPlus size={16} />} onClick={onCreate}>
            서비스 등록
          </Button>
        </AdminOnly>
      }
    >
      {isError && !apps ? (
        <p className="st-empty text-body-13" role="alert">서비스 목록을 불러오지 못했습니다.</p>
      ) : !apps ? (
        <p className="st-empty text-body-13" role="status">불러오는 중…</p>
      ) : apps.length === 0 ? (
        <p className="st-empty text-body-13" role="status">감시 대상 서비스가 없습니다.</p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>name</TableHeaderCell>
              <TableHeaderCell>표시명</TableHeaderCell>
              <TableHeaderCell align="right">수정</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.map((a) => (
              <TableRow key={a.application_uuid} onClick={() => onSelect(a.application_uuid)} selected={a.application_uuid === selectedId} aria-label={`${a.name} 설정 보기`}>
                <TableCell type="mono">{a.name}</TableCell>
                <TableCell>{a.display_name || <span className="st-muted">—</span>}</TableCell>
                <TableCell type="mono" className="st-right st-muted">
                  {short(a.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableCard>
  )
}
