import { RefObject, useCallback, useEffect, useRef } from 'react'

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"]):not(:disabled)',
].join(', ')

type UseFocusTrapParams = {
  containerRef: RefObject<HTMLDivElement | null>
  /** Whether focus trapping is active (typically: state === 'open' && isTopmost) */
  isActive: boolean
  onEntered?: () => void
  closeButtonRef: RefObject<HTMLButtonElement | null>
}

export const useFocusTrap = ({
  containerRef,
  isActive,
  onEntered,
  closeButtonRef,
}: UseFocusTrapParams) => {
  const triggerElementRef = useRef<Element | null>(null)
  const onEnteredRef = useRef(onEntered)

  onEnteredRef.current = onEntered

  // Tab trapping — only reactive effect, attaches/detaches keydown listener
  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current

    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)

      if (focusableElements.length === 0) return

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, containerRef])

  /** Call when the drawer starts opening (mounting). Captures the trigger element for later restoration. */
  const handleOpening = useCallback(() => {
    triggerElementRef.current = document.activeElement
  }, [])

  /** Call after the drawer enter transition completes. Runs onEntered, then falls back to focusing the close button. */
  const handleEntered = useCallback(() => {
    onEnteredRef.current?.()

    queueMicrotask(() => {
      const container = containerRef.current

      if (!container) return
      if (container.contains(document.activeElement)) return

      closeButtonRef.current?.focus()
    })
  }, [containerRef, closeButtonRef])

  /** Call when the drawer starts closing. Restores focus to the trigger element. */
  const handleClosing = useCallback(() => {
    const trigger = triggerElementRef.current

    if (
      trigger &&
      document.contains(trigger) &&
      typeof (trigger as HTMLElement).focus === 'function'
    ) {
      ;(trigger as HTMLElement).focus()
    }

    triggerElementRef.current = null
  }, [])

  return { handleOpening, handleEntered, handleClosing }
}
