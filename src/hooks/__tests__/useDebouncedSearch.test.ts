import { act, renderHook } from '@testing-library/react'

import { DEBOUNCE_SEARCH_MS, useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { AllTheProviders } from '~/test-utils'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.clearAllTimers()
})

async function prepare({ initialLoadingState = false }: { initialLoadingState: boolean }) {
  const callback = jest.fn()
  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
    })

  const { result } = renderHook(() => useDebouncedSearch(callback, initialLoadingState), {
    wrapper: customWrapper,
  })

  return { result: result, callback }
}

describe('useDebouncedSearch', () => {
  it('instantiate the hook with the correct initial state', async () => {
    const { result, callback } = await prepare({ initialLoadingState: false })

    expect(result.current.isLoading).toBe(true)
    expect(callback).toBeCalled()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should stop loading after debounce time is passed', async () => {
    const { result } = await prepare({ initialLoadingState: false })

    expect(result.current.isLoading).toBe(true)

    // Fast-forward until all timers have been executed
    await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

    act(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should trigger loading after the callback method is called', async () => {
    const { result, callback } = await prepare({ initialLoadingState: false })

    expect(result.current.isLoading).toBe(true)
    expect(callback).toBeCalled()
    expect(callback).toHaveBeenCalledTimes(1)

    // Fast-forward until all timers have been executed
    await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

    act(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Trigger the callback
    result?.current?.debouncedSearch?.('test')
    await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

    // Note: We cannot check that result.current.isLoading is true
    // As the value comes from initialLoadingState that cannot change in this context

    // Fast-forward until all timers have been executed
    expect(callback).toBeCalled()
    expect(callback).toHaveBeenCalledTimes(2)

    // Fast-forward until all timers have been executed
    await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

    // Loading keeps being false
    expect(result.current.isLoading).toBe(false)
  })

  describe('anti-regression', () => {
    // Fixes https://github.com/getlago/lago-front/pull/1272
    it('should fallback loading to initial if debounce timer is passed', async () => {
      const { result } = await prepare({ initialLoadingState: true })

      expect(result.current.isLoading).toBe(true)

      // Fast-forward until all timers have been executed
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

      act(() => {
        expect(result.current.isLoading).toBe(true)
      })
    })
  })
})
