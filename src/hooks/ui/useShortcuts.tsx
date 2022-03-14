import { useEffect, useMemo, useRef, useCallback } from 'react'

export interface Shortcut {
  keys: string[]
  windowsKeys?: string[] // if set, this will be used only for Windows and "keys" will be used only for Mac
  disabled?: boolean
  action: () => void
}

type CleanedShortcut = {
  keys: string[]
  action: () => void
}

type ReducedShortcut = {
  usableShortcuts: Record<string, CleanedShortcut>
  usableKeys: string[]
}

export const getCleanKey = (key: string) => {
  switch (key) {
    case 'MetaLeft':
    case 'OSLeft':
    case 'MetaRight':
    case 'OSRight':
      return 'Cmd'
    case 'AltLeft':
    case 'AltRight':
      return 'Alt'
    case 'ControlLeft':
    case 'ControlRight':
      return 'Ctrl'
    default:
      return key
  }
}

const getShortcutId = (keys: string[]): string => {
  return keys.join('').split('').sort().join('').toLowerCase()
}

type UseShortcutReturn = (shortcuts: Shortcut[]) => { isMac: boolean }
/**
 * --------- USE
 * const { isMac } = useShortcuts([
 *  {
 *    keys: ['Ctrl' + 'Enter'],
 *    disabled: true,
 *    action: () => console.log('This will work both for Mac and Windows')
 *  },
 *  {
 *    keys: ['Cmd' + 'L'],
 *    windowsKeys: ['Ctrl' + 'L'],
 *    action: () => console.log('Cmd + L will work on Mac | Ctrl + L will work on windows')
 *  }
 *
 * --------- NOTE
 * The keys must be the code of each key (got from event.code) except for :
 *  - ⌘ Command for Mac should be written `Cmd`
 *  - Control should always be `Ctrl`
 *  This is to avoid confusion between left and right keys (ie MetaLeft / MetaRight for Cmd)
 *
 * You can check the code here : https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values#code_values_on_linux_x11
 */
export const useShortcuts: UseShortcutReturn = (shortcuts) => {
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  const keyPressedRef = useRef<Record<string, boolean>>({})
  const { usableShortcuts, usableKeys } = useMemo(
    () =>
      shortcuts.reduce<ReducedShortcut>(
        (acc, shortcut) => {
          if (shortcut.disabled) return acc
          // Get keys according to OS
          const keys = (
            !!shortcut?.windowsKeys && !isMac ? shortcut?.windowsKeys : shortcut?.keys
          ).map((key) => getCleanKey(key))
          const shortcutId = getShortcutId(keys)

          acc.usableShortcuts[shortcutId] = { keys, action: shortcut.action }
          acc.usableKeys = [...acc.usableKeys, ...keys]

          return acc
        },
        { usableShortcuts: {}, usableKeys: [] }
      ),
    [shortcuts, isMac]
  )

  const onKeyDown = useCallback(
    (e) => {
      const cleanKey = getCleanKey(e.code)

      if (usableKeys.includes(cleanKey)) {
        keyPressedRef.current[cleanKey] = true

        const pressKeysID = getShortcutId(
          Object.keys(keyPressedRef.current).filter((key) => !!keyPressedRef.current[key])
        )

        if (!!usableShortcuts[pressKeysID]) {
          usableShortcuts[pressKeysID].action()

          // Clean after use of one shortcut to it to be recalled right away
          keyPressedRef.current = {}
        }
      }
    },
    [usableShortcuts, usableKeys]
  )

  const onKeyUp = useCallback((e) => {
    const cleanKey = getCleanKey(e.code)

    if (keyPressedRef.current[cleanKey]) {
      keyPressedRef.current[cleanKey] = false
    }
  }, [])

  useEffect(() => {
    if (shortcuts.length < 1) return

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      if (shortcuts.length < 1) return
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [onKeyDown, onKeyUp, shortcuts])

  return {
    isMac,
  }
}
