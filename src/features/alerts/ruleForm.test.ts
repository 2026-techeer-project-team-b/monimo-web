import { describe, expect, it } from 'vitest'
import type { AlertRule } from '@/api'
import { changesOf, conditionText, emptyForm, formOf, previewText, validate } from './ruleForm'

const RULE: AlertRule = {
  alert_rule_uuid: 'r1',
  application_uuid: 'a1',
  service_name: 'shop-payment',
  name: 'shop-payment 5xx 비율 초과',
  metric_kind: '5XX_RATE',
  operator: 'GT',
  threshold: 1,
  window_sec: 300,
  severity: 'CRITICAL',
  enabled: true,
  channels: [
    { alert_channel_uuid: 'c1', name: '#ops-alerts', type: 'SLACK' },
    { alert_channel_uuid: 'c2', name: 'oncall', type: 'EMAIL' },
  ],
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-21T04:40:12Z',
}

describe('규칙 폼', () => {
  it('표의 조건 한 줄: 기호 · 단위 · 구간', () => {
    expect(conditionText(RULE)).toBe('> 1 % / 5m')
    expect(conditionText({ ...RULE, metric_kind: 'P95_LATENCY', operator: 'GTE', threshold: 1200, window_sec: 90 })).toBe('≥ 1,200 ms / 90s')
  })

  it('빈 폼은 서비스 · 이름 · 기준값 오류가 난다', () => {
    expect(Object.keys(validate(emptyForm('')))).toEqual(['application_uuid', 'name', 'threshold'])
  })

  it('비율 지표는 100 % 를 넘을 수 없고, 지연은 넘어도 된다', () => {
    const f = { ...formOf(RULE), threshold: '150' }
    expect(validate(f).threshold).toBe('비율은 100 % 를 넘을 수 없습니다.')
    expect(validate({ ...f, metric_kind: 'P95_LATENCY' }).threshold).toBeUndefined()
    expect(validate({ ...f, threshold: '-1' }).threshold).toBe('0 이상이어야 합니다.')
    expect(validate({ ...f, threshold: 'abc' }).threshold).toBe('숫자를 적으세요.')
  })

  it('수정 저장 때 바뀐 문만 부른다 (규칙 값 · 채널 · 켜짐)', () => {
    const f = formOf(RULE)
    expect(changesOf(RULE, f)).toEqual({ rule: false, channels: false, enabled: false })
    expect(changesOf(RULE, { ...f, threshold: '1.5' })).toEqual({ rule: true, channels: false, enabled: false })
    // 채널 순서만 바뀐 건 바뀐 게 아니다
    expect(changesOf(RULE, { ...f, channel_uuids: ['c2', 'c1'] }).channels).toBe(false)
    expect(changesOf(RULE, { ...f, channel_uuids: ['c1'] }).channels).toBe(true)
    expect(changesOf(RULE, { ...f, enabled: false }).enabled).toBe(true)
  })

  it('알림 문구 미리보기', () => {
    expect(previewText(formOf(RULE))).toEqual({ tag: '[CRITICAL]', text: 'shop-payment 5xx 비율 초과 — 기준 > 1 %, 실제 (터진 순간 값) (5분)' })
  })
})
