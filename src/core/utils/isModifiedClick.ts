import { MouseEvent } from 'react'

/**
 * True when the browser should handle the click itself rather than the app —
 * a modifier click or a non-primary button on an anchor opens a new tab/window.
 */
export const isModifiedClick = (event: MouseEvent): boolean =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
