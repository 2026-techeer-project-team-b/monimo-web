import { describe, expect, it } from 'vitest'
import type { AlertChannel } from '@/api'
import { channelBodyOf, channelChangesOf, channelFormOf, emptyChannelForm, validateChannel } from './channelForm'

const SLACK: AlertChannel = {
  alert_channel_uuid: 'c1',
  name: '#ops-alerts',
  type: 'SLACK',
  enabled: true,
  // 서버는 비밀값을 가려서 준다
  config: { webhook_url: 'https://hooks.slack.com/••••/••••', channel: '#ops-alerts' },
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

describe('채널 폼', () => {
  it('수정 폼은 가린 비밀값을 칸에 넣지 않는다', () => {
    expect(channelFormOf(SLACK).config.webhook_url).toBeUndefined()
    expect(channelFormOf(SLACK).config.channel).toBe('#ops-alerts')
  })

  it('비밀값을 비워 둬도 같은 종류로 수정하면 통과, 종류를 바꾸면 새로 적어야 한다', () => {
    const f = channelFormOf(SLACK)
    expect(validateChannel(f, SLACK)).toEqual({})
    expect(validateChannel({ ...f, type: 'PAGERDUTY' }, SLACK)).toEqual({ routing_key: '값을 적으세요.' })
    // 새로 등록할 때는 비밀값이 필수
    expect(validateChannel({ ...emptyChannelForm(), name: 'x' }, null)).toEqual({ webhook_url: '값을 적으세요.' })
  })

  it('주소 · 메일 형식을 본다', () => {
    const f = { ...emptyChannelForm(), name: 'x', config: { webhook_url: 'hooks.slack.com/x' } }
    expect(validateChannel(f, null).webhook_url).toBe('http(s):// 로 시작하는 주소를 적으세요.')
    expect(validateChannel({ name: 'm', type: 'EMAIL', config: { to: 'not-mail' }, enabled: true }, null).to).toBe('메일 주소 형식이 아닙니다.')
  })

  it('보내는 본문에는 지금 종류의 칸 중 값 있는 것만 들어간다 (빈 비밀값은 빠져서 서버가 이전 값을 쓴다)', () => {
    const f = { ...channelFormOf(SLACK), name: '  #ops  ' }
    expect(channelBodyOf(f)).toEqual({ name: '#ops', type: 'SLACK', config: { channel: '#ops-alerts' } })
  })

  it('바뀐 게 없으면 저장할 게 없다. 웹훅 method 는 비어 있으면 POST 와 같다', () => {
    expect(channelChangesOf(SLACK, channelFormOf(SLACK))).toEqual({ channel: false, enabled: false })
    const hook: AlertChannel = { ...SLACK, type: 'WEBHOOK', config: { url: 'https://n8n.monimo.io/webhook/alerts' } }
    expect(channelChangesOf(hook, channelFormOf(hook)).channel).toBe(false)
    expect(channelChangesOf(SLACK, { ...channelFormOf(SLACK), config: { channel: '#ops', webhook_url: 'https://hooks.slack.com/new' } }).channel).toBe(true)
  })
})
