import { useState } from 'react'

type HeldData<T> = { key: string; data: T }

export const useHeldData = <T>(
  data: T | undefined,
  key: string,
  hasError: boolean,
): { data: T | undefined; isHeld: boolean } => {
  const [held, setHeld] = useState<HeldData<T>>()

  if (data !== undefined && (held?.data !== data || held.key !== key)) {
    setHeld({ key, data })
  } else if (data === undefined && hasError && held !== undefined) {
    // Drop it, or the retry that follows would show the pre-error data while it is in flight.
    setHeld(undefined)
  }

  if (data !== undefined) return { data, isHeld: false }

  const heldData = !hasError && held?.key === key ? held.data : undefined

  return { data: heldData, isHeld: heldData !== undefined }
}
