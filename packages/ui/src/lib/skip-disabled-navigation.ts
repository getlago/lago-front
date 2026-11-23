import { KeyboardEvent } from 'react'

export const skipDisabledNavigation = (
  event: KeyboardEvent<HTMLElement>,
  selector: string,
  orientation: 'horizontal' | 'vertical',
  loop: boolean,
): void => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(selector))
  const current = items.indexOf(document.activeElement as HTMLElement)
  const direction =
    getComputedStyle(event.currentTarget).direction ||
    event.currentTarget.closest('[dir]')?.getAttribute('dir')
  const horizontalKeys =
    direction === 'rtl' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft']
  const [forward, backward] = orientation === 'vertical' ? ['ArrowDown', 'ArrowUp'] : horizontalKeys
  const step = event.key === backward || event.key === 'End' ? -1 : 1
  let next = current + step

  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = items.length - 1
  else if (event.key !== forward && event.key !== backward) return
  if (loop) next = (next + items.length) % items.length
  if (items[next]?.getAttribute('aria-disabled') !== 'true') return

  event.preventDefault()
  event.stopPropagation()
  for (let count = 0; count < items.length; count++) {
    next += step
    if (loop) next = (next + items.length) % items.length
    const target = items[next]

    if (!target) return
    if (target.getAttribute('aria-disabled') !== 'true') {
      target.focus()
      return
    }
  }
}
