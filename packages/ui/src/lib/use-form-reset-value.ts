import { type ForwardedRef, useCallback, useEffect, useState } from 'react'

export function useFormResetValue<Value>(
  controlledValue: Value | undefined,
  defaultValue: Value,
  forwardedInputRef: ForwardedRef<HTMLInputElement> | undefined,
  formId: string | undefined,
): {
  value: Value
  setValue: (value: Value) => void
  inputRef: (input: HTMLInputElement | null) => void
} {
  const [localValue, setLocalValue] = useState(defaultValue)
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  const controlled = controlledValue !== undefined
  const inputRef = useCallback(
    (element: HTMLInputElement | null): void => {
      setInput(element)
      if (typeof forwardedInputRef === 'function') forwardedInputRef(element)
      else if (forwardedInputRef) forwardedInputRef.current = element
    },
    [forwardedInputRef],
  )

  useEffect(() => {
    const form = input?.form

    if (controlled || !form) return
    let active = true
    const reset = (event: Event): void => {
      queueMicrotask(() => {
        if (active && !event.defaultPrevented) setLocalValue(defaultValue)
      })
    }

    form.addEventListener('reset', reset)
    return (): void => {
      active = false
      form.removeEventListener('reset', reset)
    }
  }, [input, controlled, defaultValue, formId])

  return {
    value: controlled ? controlledValue : localValue,
    setValue: (value: Value): void => {
      if (!controlled) setLocalValue(value)
    },
    inputRef,
  }
}
