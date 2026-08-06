import { act, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { CREATE_MORE_SWITCH_TEST_ID } from '../CreateMoreControl'
import { useCreateMore, useCreateMoreResetIteration } from '../useCreateMore'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

describe('useCreateMore', () => {
  it('starts disabled', () => {
    const { result } = renderHook(() => useCreateMore())

    expect(result.current.isCreateMoreEnabled()).toBe(false)
  })

  it('reports enabled once the control is toggled on', async () => {
    const { result } = renderHook(() => useCreateMore())

    render(<>{result.current.createMoreControl}</>)

    await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

    expect(result.current.isCreateMoreEnabled()).toBe(true)
  })

  it('resets to disabled via resetCreateMore', async () => {
    const { result } = renderHook(() => useCreateMore())

    render(<>{result.current.createMoreControl}</>)
    await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

    act(() => result.current.resetCreateMore())

    expect(result.current.isCreateMoreEnabled()).toBe(false)
  })

  it('remounts the control switched off (every drawer open starts fresh)', async () => {
    const { result } = renderHook(() => useCreateMore())

    const { unmount } = render(<>{result.current.createMoreControl}</>)

    await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))
    expect(screen.getByRole('checkbox')).toBeChecked()

    unmount()
    render(<>{result.current.createMoreControl}</>)

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  describe('useCreateMoreResetIteration', () => {
    it('bumps the iteration on every notifyReset', () => {
      const { result } = renderHook(() => useCreateMore())
      const { result: iterationResult } = renderHook(() =>
        useCreateMoreResetIteration(result.current.resetSignal),
      )

      expect(iterationResult.current).toBe(0)

      act(() => result.current.notifyReset())
      expect(iterationResult.current).toBe(1)

      act(() => result.current.notifyReset())
      expect(iterationResult.current).toBe(2)
    })

    it('stays at zero without a signal', () => {
      const { result } = renderHook(() => useCreateMoreResetIteration(undefined))

      expect(result.current).toBe(0)
    })

    it('stops listening after unmount', () => {
      const { result } = renderHook(() => useCreateMore())
      const { result: iterationResult, unmount } = renderHook(() =>
        useCreateMoreResetIteration(result.current.resetSignal),
      )

      unmount()

      act(() => result.current.notifyReset())

      expect(iterationResult.current).toBe(0)
    })
  })
})
