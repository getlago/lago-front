import { KeyboardEvent } from 'react'

const nextIndex = (index: number, count: number, loop: boolean): number =>
  loop ? (index + count) % count : index

export const skipDisabledNavigation = (
  event: KeyboardEvent<HTMLElement>,
  selector: string,
  orientation: 'horizontal' | 'vertical',
  loop: boolean,
): void => {
  const container = event.currentTarget

  if (!container.contains(event.target instanceof Node ? event.target : null)) return
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector))
  const current = items.findIndex((item) => item === container.ownerDocument.activeElement)
  const direction = container.ownerDocument.defaultView?.getComputedStyle(container).direction
  const horizontalKeys =
    direction === 'rtl' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft']
  const [forward, backward] = orientation === 'vertical' ? ['ArrowDown', 'ArrowUp'] : horizontalKeys
  const step = event.key === backward || event.key === 'End' ? -1 : 1
  let next = (current < 0 && step < 0 ? items.length : current) + step

  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = items.length - 1
  else if (event.key !== forward && event.key !== backward) return
  next = nextIndex(next, items.length, loop)
  if (items[next]?.getAttribute('aria-disabled') !== 'true') return

  event.preventDefault()
  event.stopPropagation()
  const target = Array.from(
    { length: items.length },
    (_, offset) => items[nextIndex(next + step * (offset + 1), items.length, loop)],
  ).find((item) => item && item.getAttribute('aria-disabled') !== 'true')

  target?.focus()
}
