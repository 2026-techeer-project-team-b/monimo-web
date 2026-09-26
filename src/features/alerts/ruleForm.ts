// 규칙 만들기 · 수정 폼의 값 · 검사 · 미리보기. React 와 무관한 계산만 둔다
import type { AlertRule, AlertRuleBody, MetricKind, Operator, Severity } from '@/api'
import { fmtValue, OPERATOR, UNIT } from './metric'

export const METRIC_KINDS: MetricKind[] = ['5XX_RATE', '4XX_RATE', 'P95_LATENCY', 'CPU', 'HEAP', 'GC_TIME', 'AGENT_DOWN']
export const OPERATORS: Operator[] = ['GT', 'GTE', 'LT', 'LTE']
export const SEVERITIES: Severity[] = ['CRITICAL', 'WARNING', 'INFO']
export const WINDOWS = [60, 300, 600, 900]

/** metric_kind 가 무엇을 재는지 (erd.md alert_rules.metric_kind) */
export const METRIC_HELP: Record<MetricKind, string> = {
  '5XX_RATE': '서비스 응답 중 5xx 비율',
  '4XX_RATE': '서비스 응답 중 4xx 비율',
  P95_LATENCY: '응답 시간 p95',
  CPU: '파드 CPU 사용률',
  HEAP: '파드 힙 사용률',
  GC_TIME: '파드 GC 에 쓴 시간',
  AGENT_DOWN: '에이전트 신호가 끊긴 뒤 흐른 시간',
}

/** 5분 · 1분 30초 */
export function windowLabel(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? (s ? `${m}분 ${s}초` : `${m}분`) : `${s}초`
}

/** 표의 조건 한 줄: > 1.0 % / 5m */
export const conditionText = (r: Pick<AlertRule, 'operator' | 'threshold' | 'metric_kind' | 'window_sec'>) =>
  `${OPERATOR[r.operator]} ${fmtValue(r.threshold)} ${UNIT[r.metric_kind]} / ${r.window_sec % 60 ? `${r.window_sec}s` : `${r.window_sec / 60}m`}`

/** 입력 중인 폼 값. threshold 는 입력 글자 그대로 둔다 (지우는 중 빈 칸 · "1." 도 허용) */
export type RuleForm = Omit<AlertRuleBody, 'threshold'> & { threshold: string; application_uuid: string; enabled: boolean; channel_uuids: string[] }

export function emptyForm(applicationUuid: string): RuleForm {
  return {
    application_uuid: applicationUuid,
    name: '',
    metric_kind: '5XX_RATE',
    operator: 'GT',
    threshold: '',
    window_sec: 300,
    severity: 'WARNING',
    enabled: true,
    channel_uuids: [],
  }
}

export function formOf(r: AlertRule): RuleForm {
  return {
    application_uuid: r.application_uuid,
    name: r.name,
    metric_kind: r.metric_kind,
    operator: r.operator,
    threshold: String(r.threshold),
    window_sec: r.window_sec,
    severity: r.severity,
    enabled: r.enabled,
    channel_uuids: r.channels.map((c) => c.alert_channel_uuid),
  }
}

/** 비율(%)을 재는 값은 100 을 넘을 수 없다 */
const PERCENT: MetricKind[] = ['5XX_RATE', '4XX_RATE', 'CPU', 'HEAP']

export type FormErrors = Partial<Record<'application_uuid' | 'name' | 'threshold', string>>

export function validate(f: RuleForm): FormErrors {
  const e: FormErrors = {}
  if (!f.application_uuid) e.application_uuid = '서비스를 고르세요.'
  const name = f.name.trim()
  if (!name) e.name = '이름을 적으세요.'
  else if (name.length > 200) e.name = '200자까지 적을 수 있습니다.'
  const t = f.threshold.trim() === '' ? NaN : Number(f.threshold)
  if (!Number.isFinite(t)) e.threshold = '숫자를 적으세요.'
  else if (t < 0) e.threshold = '0 이상이어야 합니다.'
  else if (PERCENT.includes(f.metric_kind) && t > 100) e.threshold = '비율은 100 % 를 넘을 수 없습니다.'
  return e
}

/** 수정(PUT 30번) 본문. validate 를 통과한 폼에만 쓴다 */
export const bodyOf = (f: RuleForm): AlertRuleBody => ({
  name: f.name.trim(),
  metric_kind: f.metric_kind,
  operator: f.operator,
  threshold: Number(f.threshold),
  window_sec: f.window_sec,
  severity: f.severity,
})

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** 수정 저장 때 부를 문 3개 중 무엇이 필요한지 — 규칙 값(PUT) · 채널(PUT channels) · 켜짐(PATCH) */
export function changesOf(before: AlertRule, f: RuleForm) {
  const body = bodyOf(f)
  return {
    rule: (Object.keys(body) as (keyof AlertRuleBody)[]).some((k) => body[k] !== before[k]),
    channels: !sameSet(before.channels.map((c) => c.alert_channel_uuid), f.channel_uuids),
    enabled: before.enabled !== f.enabled,
  }
}

/** 알림 문구 미리보기: [CRITICAL] 이름 — 기준 > 1 %, 실제 (터진 순간 값) (5분) */
export function previewText(f: RuleForm): { tag: string; text: string } {
  const unit = UNIT[f.metric_kind]
  const t = Number(f.threshold)
  const threshold = f.threshold.trim() !== '' && Number.isFinite(t) ? `${fmtValue(t)} ${unit}` : `○ ${unit}`
  return {
    tag: `[${f.severity}]`,
    text: `${f.name.trim() || '(이름)'} — 기준 ${OPERATOR[f.operator]} ${threshold}, 실제 (터진 순간 값) (${windowLabel(f.window_sec)})`,
  }
}
