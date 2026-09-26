// 저장이 여러 문(값 · 연결 · 켜짐)으로 나뉘는 모달이 같이 쓴다 — 중간에 실패하면 앞에서 저장된 것을 같이 알린다
import { ApiError } from '@/api'

export class SaveError extends Error {
  done: string[]
  constructor(cause: unknown, done: string[]) {
    super('save failed', { cause })
    this.done = done
  }
}

export function errorText(err: unknown): string {
  const cause = err instanceof SaveError ? err.cause : err
  const base =
    cause instanceof ApiError
      ? cause.code === 'FORBIDDEN'
        ? '관리자(ADMIN)만 바꿀 수 있습니다.'
        : `${cause.message} (${cause.code})`
      : '저장하지 못했습니다.'
  return err instanceof SaveError && err.done.length ? `${base} — ${err.done.join(' · ')}은(는) 이미 저장됐습니다.` : base
}
