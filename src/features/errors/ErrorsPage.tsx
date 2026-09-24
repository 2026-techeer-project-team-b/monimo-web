import { Card } from '@/design-system'

/** 에러 화면. 이 폴더(src/features/errors/) 안에서 만든다 */
export function ErrorsPage() {
  return (
    <Card title="준비 중">
      <p className="text-body-13" style={{ margin: 0, color: 'var(--color-text-tertiary)' }}>
        에러 화면은 아직 만들지 않았습니다.
      </p>
    </Card>
  )
}
