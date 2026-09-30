import { describe, expect, it } from 'vitest'
import { blockedSummary, lockOwners, parseDump, stateCounts } from './dumpParse'

// jstack 이 실제로 찍는 모양을 줄였다. 스레드 사이는 빈 줄, 프레임은 탭으로 들여쓴다
const DUMP = [
  '2026-09-21 14:05:41',
  'Full thread dump OpenJDK 64-Bit Server VM (21.0.4+7-LTS mixed mode, sharing):',
  '',
  '"http-nio-8080-exec-12" #20 daemon prio=5 os_prio=0 tid=0x1 nid=0x2 runnable  [0x3]',
  '   java.lang.Thread.State: RUNNABLE',
  '\tat java.net.SocketInputStream.socketRead0(Native Method)',
  '\tat com.shop.order.OrderRepository.decreaseStock(OrderRepository.java:132)',
  '\t- locked <0x00007f3a8c41e2b0> (a com.shop.order.StockLock)',
  '\tat java.lang.Thread.run(Thread.java:1583)',
  '',
  '"http-nio-8080-exec-7" #21 daemon prio=5 os_prio=0 tid=0x4 nid=0x5 waiting for monitor entry  [0x6]',
  '   java.lang.Thread.State: BLOCKED (on object monitor)',
  '\tat com.shop.order.OrderService.create(OrderService.java:87)',
  '\t- waiting to lock <0x00007f3a8c41e2b0> (a com.shop.order.StockLock)',
  '\t- locked <0x00007f3a8c41f118> (a com.shop.order.OrderContext)',
  '\tat java.lang.Thread.run(Thread.java:1583)',
  '',
  '"http-nio-8080-exec-10" #22 daemon prio=5 os_prio=0 tid=0x7 nid=0x8 waiting for monitor entry  [0x9]',
  '   java.lang.Thread.State: BLOCKED (on object monitor)',
  '\tat com.shop.order.OrderService.create(OrderService.java:87)',
  '\t- waiting to lock <0x00007f3a8c41e2b0> (a com.shop.order.StockLock)',
  '',
  '"lettuce-eventExecutorLoop-1-3" #30 daemon prio=5 os_prio=0 tid=0xa nid=0xb waiting on condition  [0xc]',
  '   java.lang.Thread.State: WAITING (parking)',
  '\tat jdk.internal.misc.Unsafe.park(Native Method)',
  '\t- parking to wait for <0x00007f3a8d22ca10> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)',
  '',
  '"C2 CompilerThread0" #5 daemon prio=9 os_prio=0 tid=0xd nid=0xe waiting on condition  [0x0]',
  '   java.lang.Thread.State: RUNNABLE',
  '',
].join('\n')

describe('스레드 덤프 읽기', () => {
  const threads = parseDump(DUMP)

  it('머리말은 건너뛰고 스레드 5개를 이름 · 상태로 나눈다', () => {
    expect(threads.map((t) => [t.name, t.state])).toEqual([
      ['http-nio-8080-exec-12', 'RUNNABLE'],
      ['http-nio-8080-exec-7', 'BLOCKED'],
      ['http-nio-8080-exec-10', 'BLOCKED'],
      ['lettuce-eventExecutorLoop-1-3', 'WAITING'],
      ['C2 CompilerThread0', 'RUNNABLE'],
    ])
  })

  it('기다리는 락 · 쥔 락 · 스택 깊이를 뽑는다', () => {
    const exec7 = threads[1]
    expect(exec7.waiting).toEqual({ kind: 'lock', addr: '0x00007f3a8c41e2b0', cls: 'com.shop.order.StockLock' })
    expect(exec7.locked).toEqual([{ addr: '0x00007f3a8c41f118', cls: 'com.shop.order.OrderContext' }])
    expect(exec7.depth).toBe(2)
    // 뷰어가 노랗게 칠하는 줄이 정확히 "waiting to lock" 줄이어야 한다
    expect(exec7.lines[exec7.waitingLine]).toContain('waiting to lock')
    expect(threads[3].waiting?.kind).toBe('park')
    expect(threads[4].depth).toBe(0)
  })

  it('락 주소로 주인을 찾고, BLOCKED 가 같은 락을 기다리면 한 줄로 요약한다', () => {
    const owners = lockOwners(threads)
    expect(owners.get('0x00007f3a8c41e2b0')).toBe('http-nio-8080-exec-12')
    expect(stateCounts(threads)).toMatchObject({ RUNNABLE: 2, BLOCKED: 2, WAITING: 1, TIMED_WAITING: 0 })
    expect(blockedSummary(threads, owners)).toBe('BLOCKED 2건이 같은 락 하나(StockLock)를 기다리는 중입니다 — 주인 http-nio-8080-exec-12')
  })

  it('BLOCKED 가 없으면 요약이 없다', () => {
    const calm = parseDump(DUMP).filter((t) => t.state !== 'BLOCKED')
    expect(blockedSummary(calm, lockOwners(calm))).toBeNull()
  })
})
