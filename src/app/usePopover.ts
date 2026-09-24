import { useEffect, useRef, useState } from 'react'

/**
 * 상단바 펼침 패널 공용: 바깥 클릭 · Esc 로 닫고, 열면 패널 첫 포커스 요소로 · Esc 로 닫으면 여는 버튼으로 포커스를 돌린다.
 *   const pop = usePopover<HTMLButtonElement>()
 *   <div ref={pop.rootRef}><button ref={pop.triggerRef} aria-expanded={pop.open} onClick={pop.toggle} />{pop.open && <div ref={pop.panelRef}>…</div>}</div>
 */
export function usePopover<T extends HTMLElement = HTMLButtonElement>() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<T>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>('button, input, select, [tabindex]')?.focus()
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return { open, setOpen, toggle: () => setOpen((o) => !o), close: () => setOpen(false), rootRef, triggerRef, panelRef }
}
