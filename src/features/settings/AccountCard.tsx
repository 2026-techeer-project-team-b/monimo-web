import { useAuth } from '@/auth'
import { Badge, Button, Card, formatTime } from '@/design-system'

/** 내 계정 (20번 GET /auth/me) — 이름 · 역할 · 메일 · 가입 시각, 로그아웃 */
export function AccountCard() {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <Card className="st-account">
      <span className="st-avatar text-section-15" aria-hidden>
        {user.name.slice(0, 1)}
      </span>
      <div className="st-account__text">
        <div className="st-account__name">
          <span className="text-section-15">{user.name}</span>
          <Badge tone="accent">{user.role}</Badge>
        </div>
        <span className="text-mono-12">{user.email}</span>
        {user.created_at ? (
          <span className="text-caption-12 st-muted">
            가입 {new Date(user.created_at).toLocaleDateString('sv-SE')} {formatTime(user.created_at).slice(0, 8)}
          </span>
        ) : null}
      </div>
      <Button onClick={() => void logout()}>로그아웃</Button>
    </Card>
  )
}
