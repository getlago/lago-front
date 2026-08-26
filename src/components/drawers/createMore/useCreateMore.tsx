import { ReactNode, useEffect, useRef, useState } from 'react'

import { CreateMoreControl } from './CreateMoreControl'

export type CreateMoreResetSignal = {
  subscribe: (listener: () => void) => () => void
  notify: () => void
}

const createResetSignal = (): CreateMoreResetSignal => {
  const listeners = new Set<() => void>()

  return {
    subscribe: (listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    notify: () => listeners.forEach((listener) => listener()),
  }
}

// Drawer bodies consume the reset signal through this hook: the returned
// iteration increments on every `notifyReset()`, driving the body remount key
// and its entry animation after a "create more" save. Optional so bodies also
// rendered without the create-more system (edit mode) can call it statically.
export const useCreateMoreResetIteration = (signal?: CreateMoreResetSignal): number => {
  const [iteration, setIteration] = useState(0)

  useEffect(() => signal?.subscribe(() => setIteration((current) => current + 1)), [signal])

  return iteration
}

type UseCreateMoreReturn = {
  /** Pass as the FormDrawer `secondaryAction` in create mode only */
  createMoreControl: ReactNode
  /** Read inside the submit success branch; ref-backed so it is never stale */
  isCreateMoreEnabled: () => boolean
  /** Belt-and-braces reset called from `openDrawer` (fresh mounts are OFF already) */
  resetCreateMore: () => void
  /** Pass to the drawer body, which consumes it via `useCreateMoreResetIteration` */
  resetSignal: CreateMoreResetSignal
  /** Call after a "create more" save so the body remounts with a fresh form */
  notifyReset: () => void
}

// Reusable "Create more" drawer system: a footer toggle that keeps the drawer
// open after a successful create so the user can chain entities. The value
// lives in a ref because the FormDrawer captures `secondaryAction` and the
// submit closure once at open time.
export const useCreateMore = (): UseCreateMoreReturn => {
  const isEnabledRef = useRef(false)
  const [resetSignal] = useState(createResetSignal)

  return {
    createMoreControl: <CreateMoreControl valueRef={isEnabledRef} />,
    isCreateMoreEnabled: () => isEnabledRef.current,
    resetCreateMore: () => {
      isEnabledRef.current = false
    },
    resetSignal,
    notifyReset: () => resetSignal.notify(),
  }
}
