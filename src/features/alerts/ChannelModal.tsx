import { useId, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, createAlertChannel, getAlertChannel, setAlertChannelEnabled, updateAlertChannel, type AlertChannel, type ChannelType } from '@/api'
import { Banner, Button, Field, IconSend, Input, Modal, Segmented, Select, shortId, Switch } from '@/design-system'
import {
  CHANNEL_TYPES,
  channelBodyOf,
  channelChangesOf,
  channelFormOf,
  CONFIG_FIELDS,
  emptyChannelForm,
  keepsSecret,
  validateChannel,
  type ChannelForm,
} from './channelForm'
import { errorText, SaveError } from './saveError'

type Props = {
  /** 'new' 면 등록, uuid 면 수정, null 이면 닫힘 */
  channelId: string | null
  onClose: () => void
  /** 저장된 설정으로 시험 메시지 보내기 (결과는 화면 토스트가 보여 준다) */
  onTest: (c: AlertChannel) => void
  /** 지금 테스트 중인 채널 uuid */
  testingId: string | null
}

/** 채널 등록 · 수정 모달. 주소 channel= 로 열린다. 상세(33번)가 ADMIN 전용이라 VIEWER 는 열 수 없다 */
export function ChannelModal({ channelId, ...rest }: Props) {
  return channelId ? <Loader key={channelId} channelId={channelId} {...rest} /> : null
}

function Loader({ channelId, onClose, ...rest }: Props & { channelId: string }) {
  const isNew = channelId === 'new'
  const channel = useQuery({ queryKey: ['alert-channel', channelId], queryFn: ({ signal }) => getAlertChannel(channelId, signal), enabled: !isNew })

  if (isNew || channel.data) return <Editor channel={isNew ? null : channel.data!} onClose={onClose} {...rest} />

  const code = channel.error instanceof ApiError ? channel.error.code : ''
  return (
    <Modal open onClose={onClose} title="채널">
      {channel.isError ? (
        <p className="al-empty text-body-13" role="alert">
          {code === 'NOT_FOUND'
            ? '이 채널을 찾을 수 없습니다.'
            : code === 'FORBIDDEN'
              ? '채널 설정은 관리자(ADMIN)만 볼 수 있습니다.'
              : `채널을 불러오지 못했습니다. ${code ? `(${code})` : ''}`}
        </p>
      ) : (
        <p className="al-empty text-body-13" role="status">불러오는 중…</p>
      )}
    </Modal>
  )
}

function Editor({ channel, onClose, onTest, testingId }: Omit<Props, 'channelId'> & { channel: AlertChannel | null }) {
  const qc = useQueryClient()
  const id = useId()
  const [form, setForm] = useState<ChannelForm>(() => (channel ? channelFormOf(channel) : emptyChannelForm()))
  const [showErrors, setShowErrors] = useState(false)
  const setConfig = (key: string, value: string) => setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }))

  const errors = validateChannel(form, channel)
  const changes = channel ? channelChangesOf(channel, form) : null
  const dirty = !changes || changes.channel || changes.enabled

  const save = useMutation({
    mutationFn: async (f: ChannelForm) => {
      if (!channel) return createAlertChannel({ ...channelBodyOf(f), enabled: f.enabled })
      const c = channelChangesOf(channel, f)
      const done: string[] = []
      try {
        if (c.channel) {
          await updateAlertChannel(channel.alert_channel_uuid, channelBodyOf(f))
          done.push('설정')
        }
        if (c.enabled) await setAlertChannelEnabled(channel.alert_channel_uuid, f.enabled)
      } catch (err) {
        throw new SaveError(err, done)
      }
    },
    // 규칙 탭의 채널 고르기 · 규칙 표의 채널 이름도 같이 다시 받는다
    onSettled: () => Promise.all(['alert-channels', 'alert-channel', 'alert-rules', 'alert-rule'].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
    onSuccess: onClose,
  })

  const submit = () => {
    setShowErrors(true)
    if (Object.keys(errors).length === 0 && dirty) save.mutate(form)
  }

  const err = showErrors ? errors : {}
  const testing = !!channel && testingId === channel.alert_channel_uuid

  return (
    <Modal
      open
      onClose={onClose}
      className="al-channel-modal"
      title={
        <span className="al-rule-modal__title">
          {channel ? `채널 수정 — ${channel.name}` : '채널 등록'}
          <span className="text-mono-11 al-muted" title={channel?.alert_channel_uuid}>
            {channel ? `alert_channel_uuid ${shortId(channel.alert_channel_uuid)} · PUT /alert-channels/{uuid}` : 'POST /alert-channels'}
          </span>
        </span>
      }
      footer={
        <div className="al-rule-modal__footer">
          {channel ? (
            <Button icon={<IconSend size={16} />} disabled={testing || save.isPending} onClick={() => onTest(channel)} title="저장된 설정으로 보냅니다">
              {testing ? '보내는 중…' : '테스트 발송'}
            </Button>
          ) : null}
          <span className="text-caption-12 al-muted">{channel && dirty ? '테스트는 저장된 설정으로 보냅니다' : ''}</span>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" type="submit" form={`${id}-form`} disabled={save.isPending || !dirty}>
            {save.isPending ? '저장 중…' : channel ? '저장' : '등록'}
          </Button>
        </div>
      }
    >
      <form
        id={`${id}-form`}
        className="al-channel-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {save.isError ? <Banner tone="crit">{errorText(save.error)}</Banner> : null}
        <fieldset className="al-channel-form__fields" disabled={save.isPending}>
          <Field label="name" htmlFor={`${id}-name`} error={err.name}>
            <Input
              id={`${id}-name`}
              value={form.name}
              maxLength={100}
              placeholder="예: 백엔드 알람방"
              aria-invalid={!!err.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>

          <div className="al-field">
            <span className="text-caption-12-medium">type</span>
            <Segmented<ChannelType>
              aria-label="type"
              className="al-channel-form__types"
              value={form.type}
              onChange={(t) => setForm((f) => ({ ...f, type: t }))}
              options={CHANNEL_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <section className="al-config" aria-label={`config · ${form.type}`}>
            <div className="al-channels__legend">
              <span className="text-caption-12-medium">config · {form.type}</span>
              <span className="text-mono-11 al-muted">alert_channels.config (JSONB)</span>
            </div>
            {CONFIG_FIELDS[form.type].map((field) => {
              const fid = `${id}-${field.key}`
              const kept = field.secret && keepsSecret(channel, form, field.key)
              const help = field.secret
                ? kept
                  ? '저장된 값은 가려서 보여 줍니다 · 비워 두면 그대로, 새 값을 적으면 바뀝니다'
                  : '비밀값 — 저장한 뒤에는 가려서 보여 줍니다'
                : field.required
                  ? undefined
                  : '선택'
              return (
                <Field key={field.key} label={field.key} htmlFor={fid} help={help} error={err[field.key]}>
                  {field.options ? (
                    <Select id={fid} value={form.config[field.key] || field.options[0]} onChange={(e) => setConfig(field.key, e.target.value)}>
                      {field.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={fid}
                      className={field.key === 'channel' ? undefined : 'text-mono-12'}
                      type={field.secret ? 'password' : field.key === 'to' ? 'email' : 'text'}
                      autoComplete="off"
                      value={form.config[field.key] ?? ''}
                      placeholder={kept ? channel!.config[field.key] : field.placeholder}
                      aria-invalid={!!err[field.key]}
                      onChange={(e) => setConfig(field.key, e.target.value)}
                    />
                  )}
                </Field>
              )
            })}
          </section>

          <div className="al-rule-form__switch">
            <span id={`${id}-enabled`} className="text-caption-12-medium">
              enabled
            </span>
            <span className="text-caption-12 al-muted">{form.enabled ? '켜짐' : '꺼짐 — 이 채널로는 알림이 나가지 않습니다'}</span>
            <Switch aria-labelledby={`${id}-enabled`} checked={form.enabled} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
