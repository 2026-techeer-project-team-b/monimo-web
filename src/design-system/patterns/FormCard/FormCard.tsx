import type { FormEvent, ReactNode } from 'react'
import { cx } from '../../cx'
import './FormCard.css'

export type FormCardProps = {
  /** Section/15 제목. 예: 경보 규칙 수정 */
  title: ReactNode
  /** 카드 맨 위 안내. 보통 <Banner tone="warn">409 CONFLICT …</Banner> · <Banner tone="crit">503 UNAVAILABLE …</Banner> */
  banners?: ReactNode
  /** <Field> 들. 라벨은 입력 위, 입력 높이 36, 오류 문구는 입력 바로 아래 (05-B Field 가 맡는다) */
  children: ReactNode
  /** 저장(primary) · 취소(secondary) 버튼 */
  actions: ReactNode
  /** ADMIN 전용 액션 옆 권한 캡션. 예: VIEWER는 읽기만 · 변경은 ADMIN */
  permissionNote?: ReactNode
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  className?: string
}

/**
 * Figma 06 P6 폼 규칙 — 카드 안에 제목 · 안내 배너 · 필드 · 액션을 이 순서로 쌓는다 (간격 space/3).
 * 네이티브 <form> 이라 Enter 로 제출된다. 저장 버튼은 type="submit" 으로 넣는다.
 * 페이지 새로고침은 여기서 항상 막고(preventDefault) onSubmit 을 부른다.
 */
export function FormCard({ title, banners, children, actions, permissionNote, onSubmit, className }: FormCardProps) {
  return (
    <form
      className={cx('ds-form-card', className)}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(e)
      }}
      noValidate
    >
      <h2 className="ds-form-card__title text-section-15">{title}</h2>
      {banners}
      {children}
      <div className="ds-form-card__actions">
        <div className="ds-form-card__buttons">{actions}</div>
        {permissionNote ? <p className="ds-form-card__note text-caption-12">{permissionNote}</p> : null}
      </div>
    </form>
  )
}
