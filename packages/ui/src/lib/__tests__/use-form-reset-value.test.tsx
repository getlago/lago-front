import { act, renderHook } from '@testing-library/react'

import { useFormResetValue } from '../use-form-reset-value'

it.each([false, true])(
  'waits for reset propagation before synchronizing (canceled: %s)',
  async (canceled) => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] })
    const form = document.createElement('form')
    const input = document.createElement('input')

    form.append(input)
    const { result, unmount } = renderHook(() =>
      useFormResetValue(undefined, 'default', undefined, undefined),
    )

    try {
      act(() => result.current.inputRef(input))
      act(() => result.current.setValue('edited'))
      const event = new Event('reset', { cancelable: true })

      await act(async () => {
        form.dispatchEvent(event)
        // Browsers can flush microtasks before React's delegated reset handler runs.
        await Promise.resolve()
      })
      expect(result.current.value).toBe('edited')
      if (canceled) event.preventDefault()
      act(() => jest.runOnlyPendingTimers())
      expect(result.current.value).toBe(canceled ? 'edited' : 'default')
    } finally {
      unmount()
      jest.useRealTimers()
    }
  },
)
