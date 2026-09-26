// 채널 등록 · 수정 폼의 값 · 검사. React 와 무관한 계산만 둔다
import type { AlertChannel, AlertChannelBody, ChannelType } from '@/api'

export const CHANNEL_TYPES: ChannelType[] = ['SLACK', 'EMAIL', 'WEBHOOK', 'PAGERDUTY']

export type ConfigField = {
  key: string
  placeholder: string
  required: boolean
  /** 서버가 가려서(••••) 주는 값. 비워 두면 이전 값을 그대로 쓴다 */
  secret?: boolean
  /** 정해진 값 중 고르기 (Select) */
  options?: string[]
}

/** 종류별 config 칸 (alert_channels.config JSONB) */
export const CONFIG_FIELDS: Record<ChannelType, ConfigField[]> = {
  SLACK: [
    { key: 'webhook_url', placeholder: 'https://hooks.slack.com/services/…', required: true, secret: true },
    { key: 'channel', placeholder: '#ops-alerts', required: false },
  ],
  EMAIL: [
    { key: 'to', placeholder: 'oncall@monimo.io', required: true },
    { key: 'subject_prefix', placeholder: '[MONIMO]', required: false },
  ],
  WEBHOOK: [
    { key: 'url', placeholder: 'https://n8n.monimo.io/webhook/alerts', required: true },
    { key: 'method', placeholder: 'POST', required: false, options: ['POST', 'PUT'] },
  ],
  PAGERDUTY: [{ key: 'routing_key', placeholder: 'Events API v2 routing key', required: true, secret: true }],
}

/** 입력 중인 폼 값. config 는 지금 고른 종류의 칸만 본다 (종류를 바꿔도 다른 종류 칸 값은 남겨 둔다) */
export type ChannelForm = { name: string; type: ChannelType; config: Record<string, string>; enabled: boolean }

export function emptyChannelForm(): ChannelForm {
  return { name: '', type: 'SLACK', config: { method: 'POST' }, enabled: true }
}

/** 수정 폼 첫 값. 비밀값 칸은 비워 두고(가린 값은 placeholder 로만 보여 준다) 나머지는 그대로 */
export function channelFormOf(c: AlertChannel): ChannelForm {
  const secrets = new Set(CONFIG_FIELDS[c.type].filter((f) => f.secret).map((f) => f.key))
  const config = Object.fromEntries(Object.entries(c.config).filter(([k]) => !secrets.has(k)))
  return { name: c.name, type: c.type, config: { method: 'POST', ...config }, enabled: c.enabled }
}

/** 이 칸에 저장된(가린) 값이 있어 비워 둬도 되는지 — 수정 중이고 종류를 바꾸지 않았을 때만 */
export const keepsSecret = (before: AlertChannel | null, f: ChannelForm, key: string) =>
  !!before && before.type === f.type && !!before.config[key]

export type ChannelErrors = Partial<Record<string, string>>

export function validateChannel(f: ChannelForm, before: AlertChannel | null): ChannelErrors {
  const e: ChannelErrors = {}
  const name = f.name.trim()
  if (!name) e.name = '이름을 적으세요.'
  else if (name.length > 100) e.name = '100자까지 적을 수 있습니다.'
  for (const field of CONFIG_FIELDS[f.type]) {
    const v = (f.config[field.key] ?? '').trim()
    if (!v) {
      if (field.required && !(field.secret && keepsSecret(before, f, field.key))) e[field.key] = '값을 적으세요.'
      continue
    }
    if ((field.key === 'webhook_url' || field.key === 'url') && !/^https?:\/\//.test(v)) e[field.key] = 'http(s):// 로 시작하는 주소를 적으세요.'
    if (field.key === 'to' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) e[field.key] = '메일 주소 형식이 아닙니다.'
  }
  return e
}

/** 등록 · 수정 본문. 지금 종류의 칸 중 값이 있는 것만 보낸다 (비운 비밀값은 빠져서 서버가 이전 값을 쓴다) */
export function channelBodyOf(f: ChannelForm): AlertChannelBody {
  const config: Record<string, string> = {}
  for (const { key } of CONFIG_FIELDS[f.type]) {
    const v = (f.config[key] ?? '').trim()
    if (v) config[key] = v
  }
  return { name: f.name.trim(), type: f.type, config }
}

/** 수정 저장 때 부를 문 — 설정(PUT 17) · 켜짐(PATCH 7) */
export function channelChangesOf(before: AlertChannel, f: ChannelForm) {
  const body = channelBodyOf(f)
  const configChanged =
    CONFIG_FIELDS[f.type].some(({ key, secret }) => (secret ? key in body.config : (body.config[key] ?? '') !== (before.config[key] ?? ''))) ||
    // 종류를 바꾸면 이전 종류의 칸이 사라지는 것도 바뀐 것이다
    before.type !== f.type
  return { channel: body.name !== before.name || configChanged, enabled: before.enabled !== f.enabled }
}
