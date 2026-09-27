import { useEffect, useRef, useState } from 'react'
import { Button, Card, CodeBlock, IconCopy } from '@/design-system'

/** 수집기 주소. 배포마다 다르므로 .env 로 바꿀 수 있게 둔다 */
const COLLECTOR = import.meta.env.VITE_COLLECTOR_ENDPOINT || 'https://collector.monimo.dev:4317'

/** 에이전트 부착 — 이 서비스의 JVM 에 붙일 명령. otel.service.name 이 서비스 이름과 같아야 신호가 이 서비스로 모인다 */
export function AgentAttachCard({ serviceName }: { serviceName: string }) {
  const cmd = [
    'java -javaagent:opentelemetry-javaagent.jar \\',
    `     -Dotel.service.name=${serviceName} \\`,
    `     -Dotel.exporter.otlp.endpoint=${COLLECTOR} \\`,
    '     -Dotel.javaagent.extensions=monimo-ext.jar \\',
    '     -jar app.jar',
  ].join('\n')
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <Card
      title="에이전트 부착"
      actions={
        <Button
          icon={<IconCopy size={14} />}
          onClick={() =>
            navigator.clipboard.writeText(cmd).then(() => {
              clearTimeout(timer.current)
              setCopied(true)
              timer.current = setTimeout(() => setCopied(false), 2000)
            })
          }
        >
          {copied ? '복사됨' : '복사'}
        </Button>
      }
    >
      <div className="st-attach">
        <CodeBlock aria-label="에이전트 부착 명령">{cmd}</CodeBlock>
        <span className="text-caption-12 st-muted">Java 17 + Spring Boot 3.x · mTLS 인증서 필요</span>
      </div>
    </Card>
  )
}
