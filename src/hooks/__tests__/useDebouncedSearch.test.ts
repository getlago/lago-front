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
    expect(callback).toHaveBeenCalled()
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
    expect(callback).toHaveBeenCalled()
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
    expect(callback).toHaveBeenCalled()
    expect(callback).toHaveBeenCalledTimes(2)

    // Fast-forward until all timers have been executed
    await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

    // Loading keeps being false
    expect(result.current.isLoading).toBe(false)
  })

  describe('minimum search characters', () => {
    it('does not trigger the search query when typing less than 3 characters', async () => {
      const { result, callback } = await prepare({ initialLoadingState: false })

      // Initial query on mount
      expect(callback).toHaveBeenCalledTimes(1)

      result?.current?.debouncedSearch?.('a')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))
      result?.current?.debouncedSearch?.('ab')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('triggers the search query with 3 characters or more', async () => {
      const { result, callback } = await prepare({ initialLoadingState: false })

      result?.current?.debouncedSearch?.('abc')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenLastCalledWith({ variables: { searchTerm: 'abc' } })
    })

    it('restores the unfiltered list when going back under 3 characters after a search', async () => {
      const { result, callback } = await prepare({ initialLoadingState: false })

      result?.current?.debouncedSearch?.('abc')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))
      result?.current?.debouncedSearch?.('ab')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenLastCalledWith({ variables: { searchTerm: undefined } })
    })

    it('restores the unfiltered list when the search is cleared after a search', async () => {
      const { result, callback } = await prepare({ initialLoadingState: false })

      result?.current?.debouncedSearch?.('abc')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))
      result?.current?.debouncedSearch?.('')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenLastCalledWith({ variables: { searchTerm: undefined } })
    })

    it('ignores surrounding whitespace when counting characters', async () => {
      const { result, callback } = await prepare({ initialLoadingState: false })

      result?.current?.debouncedSearch?.('  ab  ')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('does not re-trigger the search query for the same term', async () => {
      const { result, callback } = await prepare({ initialLoadingState: false })

      result?.current?.debouncedSearch?.('abc')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))
      result?.current?.debouncedSearch?.('abc')
      await act(() => jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS))

      expect(callback).toHaveBeenCalledTimes(2)
    })
  })

  describe('GIVEN the initial query is gated through the enabled argument', () => {
    const prepareGated = ({ enabled }: { enabled: boolean }) => {
      const callback = jest.fn()
      const customWrapper = ({ children }: { children: React.ReactNode }) =>
        AllTheProviders({ children })

      const { rerender } = renderHook(
        ({ isEnabled }: { isEnabled: boolean }) => useDebouncedSearch(callback, false, isEnabled),
        { wrapper: customWrapper, initialProps: { isEnabled: enabled } },
      )

      return { callback, rerender }
    }

    describe('WHEN enabled is false', () => {
      it('THEN should not run the initial query', () => {
        const { callback } = prepareGated({ enabled: false })

        expect(callback).not.toHaveBeenCalled()
      })
    })

    describe('WHEN enabled turns true after the first render', () => {
      it('THEN should run the initial query once', () => {
        const { callback, rerender } = prepareGated({ enabled: false })

        rerender({ isEnabled: true })

        expect(callback).toHaveBeenCalledTimes(1)
      })

      it('THEN should not run the initial query again on later re-renders', () => {
        const { callback, rerender } = prepareGated({ enabled: false })

        rerender({ isEnabled: true })
        rerender({ isEnabled: false })
        rerender({ isEnabled: true })

        expect(callback).toHaveBeenCalledTimes(1)
      })
    })
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
