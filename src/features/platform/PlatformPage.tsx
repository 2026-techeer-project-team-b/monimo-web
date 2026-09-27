import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCanary, listCanaryEvents, listPlatformServices, type CanaryEventKind } from '@/api'
import {
  Badge,
  Banner,
  Card,
  formatTime,
  StatusBadge,
  StatusDot,
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type Tone,
} from '@/design-system'
import { useTimeWindow } from '@/stores'
import './Platform.css'

const hhmmss = (iso: string) => formatTime(iso).slice(0, 8)
const KIND_TONE: Record<CanaryEventKind, Tone> = { FRESH: 'ok', STALE: 'crit', DMS_MISSED: 'warn' }

/** 카나리가 지나가는 길 — 각 단계가 무엇을 확인하는지. 단계별 통과 시각을 주는 문은 아직 없다 */
const PATH: { name: string; sub: string; note?: string; outside?: boolean }[] = [
  { name: '파수꾼', sub: 'AWS Lambda', note: '30초마다 발사', outside: true },
  { name: '쇼핑몰 주문 API', sub: 'POST /orders', note: 'tracestate monimon=canary' },
  { name: 'OTel Agent', sub: 'shop-order 파드', note: '실제 요청과 같은 경로로 기록' },
  { name: '수집기', sub: 'gRPC 4317 · mTLS', note: '1% 샘플링 예외(전량 통과)' },
  { name: 'Kafka raw', sub: '토픽', note: '적재 대기' },
  { name: '적재 처리기', sub: '배치 쓰기', note: 'Kafka → ClickHouse' },
  { name: 'ClickHouse', sub: 'spans', note: '조회 가능해짐' },
  { name: 'API 서버', sub: 'platform/canary', note: '신선도 판정' },
]

/** 플랫폼 상태 (S10) — 감시 체계 자신이 살아 있는지. ⚠️ 제안 문 #51~#53 에 기댄다 (명세 미확정) */
export function PlatformPage() {
  const { from, to } = useTimeWindow()
  const canary = useQuery({ queryKey: ['platform-canary'], queryFn: ({ signal }) => getCanary(signal), refetchInterval: 30_000, retry: false })
  const services = useQuery({ queryKey: ['platform-services', to], queryFn: ({ signal }) => listPlatformServices(signal), placeholderData: keepPreviousData })
  const events = useQuery({
    queryKey: ['platform-canary-events', from, to],
    queryFn: ({ signal }) => listCanaryEvents({ from, to, limit: 200 }, signal),
    placeholderData: keepPreviousData,
  })

  const c = canary.isError ? undefined : canary.data
  // 서버 기준 "지금" = 마지막 신호 + 나이. 브라우저 시계와 어긋나도 서버가 본 시간으로 잰다
  const serverNow = c ? Date.parse(c.last_signal_at) + c.age_sec * 1000 : null
  const dmsAgo = c?.dms_last_ping_at && serverNow ? Math.round((serverNow - Date.parse(c.dms_last_ping_at)) / 1000) : null
  const rows = events.data?.items ?? []
  const judged = rows.filter((e) => e.kind !== 'DMS_MISSED')
  const freshRate = judged.length ? (judged.filter((e) => e.kind === 'FRESH').length / judged.length) * 100 : null
  const tone: Tone = !c ? 'muted' : c.fresh ? 'ok' : 'crit'

  return (
    <div className="pf-page">
      <Banner tone="info">
        이 화면이 부르는 문 3개(<span className="text-mono-12">/platform/canary · /platform/services · /platform/canary/events</span>)는 아직 명세에 없는 <b>제안 문</b>입니다. 지금 값은 가짜 응답입니다.
      </Banner>

      <section className={`pf-hero is-${tone}`} aria-live="polite">
        <div className="pf-hero__main">
          <StatusDot tone={tone} className="pf-hero__dot" />
          <div>
            <h2 className="text-section-15">
              {!c
                ? canary.isError
                  ? '플랫폼 상태를 확인하지 못했습니다'
                  : '확인 중…'
                : c.fresh
                  ? `플랫폼 정상 — 카나리 신선도 ${c.age_sec}초 (기준 ${c.threshold_sec}초)`
                  : `카나리 지연 — ${c.age_sec}초째 새 카나리가 조회되지 않습니다 (기준 ${c.threshold_sec}초)`}
            </h2>
            <span className="text-mono-11 pf-muted">
              GET /platform/canary{c ? ` · fresh = ${c.fresh} · 마지막 신호 ${hhmmss(c.last_signal_at)}` : ''}
            </span>
          </div>
        </div>
        <dl className="pf-kpis">
          <div>
            <dt className="text-caption-12-medium">최근 카나리 FRESH 비율</dt>
            <dd className="text-number-28">{freshRate === null ? '—' : `${freshRate.toFixed(1)} %`}</dd>
            <span className="text-caption-12 pf-muted">상단바 시간 범위 · {judged.length}회 판정</span>
          </div>
          <div>
            <dt className="text-caption-12-medium">Dead Man's Switch 마지막 핑</dt>
            <dd className={`text-number-28${dmsAgo !== null && dmsAgo > 90 ? ' pf-warn' : ''}`}>{dmsAgo === null ? '—' : `${dmsAgo}초 전`}</dd>
            <span className="text-caption-12 pf-muted">파수꾼 자신이 살아 있는지</span>
          </div>
        </dl>
      </section>

      <Card className="pf-path" title="카나리 관통 경로">
        <ol className="pf-path__steps">
          {PATH.map((s, i) => {
            const last = i === PATH.length - 1
            return (
              <li key={s.name} className={`pf-step${s.outside ? ' is-outside' : ''}${last ? ' is-last' : ''}`}>
                <div className="pf-step__box">
                  <span className="pf-step__name text-body-13-strong">
                    <StatusDot tone={last ? tone : 'muted'} /> {s.name}
                  </span>
                  <span className="text-mono-11 pf-muted">{s.sub}</span>
                </div>
                <span className="text-caption-12 pf-muted">{last && c ? `조회 가능 ${hhmmss(c.last_signal_at)} · age_sec ${c.age_sec}` : s.note}</span>
              </li>
            )
          })}
        </ol>
        <p className="text-caption-12 pf-muted pf-path__foot">
          판정은 서비스마다 뛰는 하트비트가 아니라, 실제로 끝까지 관통한 카나리의 신선도(age_sec ≤ threshold_sec)입니다.
          {c && !c.fresh ? ' 어느 단계에서 막혔는지는 단계별 통과 시각 문이 없어 이 화면에서 짚을 수 없습니다 — 아래 우리 서비스 준비 상태를 먼저 보세요.' : ''}
        </p>
      </Card>

      <section className="pf-services" aria-labelledby="pf-services-title">
        <header className="pf-services__head">
          <h2 id="pf-services-title" className="text-section-15">
            우리 서비스 {services.data ? `${services.data.length}개` : ''}
          </h2>
          <span className="text-caption-12 pf-muted">판정 기준 /readyz — 의존 저장소까지 닿아야 준비 완료 · GET /platform/services</span>
        </header>
        {services.isError && !services.data ? (
          <Card>
            <p className="pf-empty text-body-13" role="alert">서비스 준비 상태를 불러오지 못했습니다.</p>
          </Card>
        ) : !services.data ? (
          <Card>
            <p className="pf-empty text-body-13" role="status">불러오는 중…</p>
          </Card>
        ) : (
          <ul className="pf-services__grid">
            {services.data.map((s) => (
              <li key={s.service_name}>
                <Card className={s.ready ? 'pf-svc' : 'pf-svc is-down'}>
                  <div className="pf-svc__head">
                    <StatusDot tone={s.ready ? 'ok' : 'warn'} />
                    <span className="text-mono-12-strong">{s.service_name}</span>
                    <StatusBadge tone={s.ready ? 'ok' : 'warn'}>{s.ready ? 'READY' : 'NOT_READY'}</StatusBadge>
                  </div>
                  <div className="pf-svc__deps">
                    {s.deps.map((d) => (
                      <Badge key={d} tone="muted">
                        {d}
                      </Badge>
                    ))}
                    {s.note ? <Badge tone="warn">{s.note}</Badge> : null}
                  </div>
                  <div className="pf-svc__foot text-caption-12">
                    <span>파드 {s.pod_count}</span>
                    <span className="pf-muted">확인 {hhmmss(s.checked_at)}</span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pf-bottom">
        <TableCard
          title={
            <span className="pf-title">
              최근 카나리 이벤트 <span className="text-mono-11 pf-muted">GET /platform/canary/events · {events.data ? `${rows.length}${events.data.nextCursor ? '+' : ''}건` : ''}</span>
            </span>
          }
          className="pf-events"
          summary="STALE 이면 파수꾼이 우리 알림 서비스를 거치지 않고 Slack 으로 직접 보낸다 (알림 서비스가 죽었을 수도 있으니)"
        >
          {events.isError && !events.data ? (
            <p className="pf-empty text-body-13" role="alert">카나리 이벤트를 불러오지 못했습니다.</p>
          ) : !events.data ? (
            <p className="pf-empty text-body-13" role="status">불러오는 중…</p>
          ) : rows.length === 0 ? (
            <p className="pf-empty text-body-13" role="status">이 시간 범위에 카나리 이벤트가 없습니다.</p>
          ) : (
            <div className="pf-events__scroll">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>시각</TableHeaderCell>
                    <TableHeaderCell>종류</TableHeaderCell>
                    <TableHeaderCell align="right">age_sec</TableHeaderCell>
                    <TableHeaderCell align="right">threshold_sec</TableHeaderCell>
                    <TableHeaderCell>조치</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((e, i) => (
                    // 이벤트에 고유 id 가 없어 시각 · 종류가 겹칠 수 있으니 순번을 섞는다
                    <TableRow key={`${e.ts}-${e.kind}-${i}`} className={e.kind === 'FRESH' ? undefined : 'pf-row-alert'}>
                      <TableCell type="mono">{hhmmss(e.ts)}</TableCell>
                      <TableCell type="badge">
                        <Badge tone={KIND_TONE[e.kind]}>{e.kind}</Badge>
                      </TableCell>
                      <TableCell type="number" className={e.kind === 'STALE' ? 'pf-crit' : undefined}>
                        {e.age_sec ?? '—'}
                      </TableCell>
                      <TableCell type="number">{e.threshold_sec}</TableCell>
                      <TableCell>{e.action ?? <span className="pf-muted">—</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TableCard>

        <Card className="pf-self" title={<span className="pf-title">파수꾼 자신 <Badge tone="warn">스택 외부</Badge></span>}>
          <dl className="pf-self__list">
            <div>
              <dt className="text-caption-12-medium">실행 위치</dt>
              <dd className="text-body-13">AWS Lambda — 감시 대상 클러스터 바깥에서 돈다</dd>
            </div>
            <div>
              <dt className="text-caption-12-medium">주기</dt>
              <dd className="text-body-13">30초</dd>
            </div>
            <div>
              <dt className="text-caption-12-medium">알림 경로</dt>
              <dd className="text-body-13">Slack 직접 발송 — 우리 알림 서비스를 거치지 않는다</dd>
            </div>
            <div>
              <dt className="text-caption-12-medium">Dead Man's Switch</dt>
              <dd className="text-body-13">Healthchecks.io — 파수꾼이 죽으면 외부가 알린다</dd>
            </div>
          </dl>
          <Banner tone="info">Dead Man's Switch 업체는 구현 때 다시 정합니다. 자체 호스팅으로 바꾸면 "외부가 우리를 본다"는 성질이 사라집니다.</Banner>
        </Card>
      </div>
    </div>
  )
}
