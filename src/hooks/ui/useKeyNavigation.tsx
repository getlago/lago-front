import { KeyboardEventHandler, useCallback } from 'react'

interface useKeyNavigationOptions {
  getElmId: (id: string | number) => string
  disabled?: boolean
}
type UseKeyNavigation<T = HTMLDivElement> = (options: useKeyNavigationOptions) => {
  onKeyDown: KeyboardEventHandler<T>
}

// Allow to navigate in a list
export const useKeysNavigation: UseKeyNavigation = ({ getElmId, disabled = false }) => {
  return {
    onKeyDown: useCallback(
      (e) => {
        if (disabled) {
          return
        }

        const getIndex = (document.activeElement?.id || '').split(getElmId(''))[1]
        let nextId = null

        if (['ArrowDown', 'KeyJ'].includes(e.code)) {
          e.stopPropagation()
          e.preventDefault()
          nextId = getElmId(parseInt(getIndex) + 1)
        }

        if (['ArrowUp', 'KeyK'].includes(e.code)) {
          e.stopPropagation()
          e.preventDefault()
          nextId = getElmId(parseInt(getIndex) - 1)
        }

        if (!nextId) return

        const elementToFocus = document.getElementById(nextId)

        elementToFocus && elementToFocus.focus()
      },
      [disabled, getElmId]
    ),
  }
}
