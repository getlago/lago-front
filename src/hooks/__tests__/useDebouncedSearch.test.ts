import { act, renderHook } from '@testing-library/react'

import { DEBOUNCE_SEARCH_MS, useDebouncedSearch } from '~/hooks/useDebouncedSearch'

const advanceTime = (milliseconds: number): void => {
  act(() => {
    jest.advanceTimersByTime(milliseconds)
  })
}

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(0)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('fetches once on mount and keeps the initial spinner for the debounce interval', () => {
    const searchQuery = jest.fn()
    const { result, rerender } = renderHook(() => useDebouncedSearch(searchQuery, false))

    expect(searchQuery).toHaveBeenCalledTimes(1)
    expect(searchQuery).toHaveBeenCalledWith()
    expect(result.current.isLoading).toBe(true)
    rerender()
    expect(searchQuery).toHaveBeenCalledTimes(1)

    advanceTime(DEBOUNCE_SEARCH_MS - 1)
    expect(result.current.isLoading).toBe(true)
    advanceTime(1)
    expect(result.current.isLoading).toBe(false)
  })

  it('returns a callable and cancellable handler when no query or loading state is supplied', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    result.current.debouncedSearch('local option')
    advanceTime(DEBOUNCE_SEARCH_MS)

    expect(result.current.isLoading).toBe(false)
    result.current.debouncedSearch('another option')
    result.current.debouncedSearch.cancel()
    expect(jest.getTimerCount()).toBe(0)
  })

  it('debounces rapid edits and keeps the handler stable across loading changes', () => {
    const searchQuery = jest.fn()
    const { result, rerender } = renderHook(
      ({ loading }) => useDebouncedSearch(searchQuery, loading),
      {
        initialProps: { loading: false },
      },
    )
    const handler = result.current.debouncedSearch

    handler('first')
    advanceTime(DEBOUNCE_SEARCH_MS - 1)
    handler('latest')
    rerender({ loading: true })
    expect(result.current.debouncedSearch).toBe(handler)
    advanceTime(DEBOUNCE_SEARCH_MS - 1)
    expect(searchQuery).toHaveBeenCalledTimes(1)
    advanceTime(1)
    expect(searchQuery).toHaveBeenCalledTimes(2)
    expect(searchQuery).toHaveBeenLastCalledWith({ variables: { searchTerm: 'latest' } })
  })

  it('cancels pending searches and spinner timers on unmount', () => {
    const searchQuery = jest.fn()
    const { result, unmount } = renderHook(() => useDebouncedSearch(searchQuery, false))

    result.current.debouncedSearch('cancelled')
    unmount()
    expect(jest.getTimerCount()).toBe(0)
    advanceTime(DEBOUNCE_SEARCH_MS)
    expect(searchQuery).toHaveBeenCalledTimes(1)
  })

  describe('search normalization', () => {
    it.each(['', 'a', 'ab', '  ab  '])(
      'does not repeat the initial unfiltered query for %j',
      (value) => {
        const searchQuery = jest.fn()
        const { result } = renderHook(() => useDebouncedSearch(searchQuery))

        result.current.debouncedSearch(value)
        advanceTime(DEBOUNCE_SEARCH_MS)
        expect(searchQuery).toHaveBeenCalledTimes(1)
      },
    )

    it.each(['abc', '  abc  '])('preserves the original search value for %j', (value) => {
      const searchQuery = jest.fn()
      const { result } = renderHook(() => useDebouncedSearch(searchQuery))

      result.current.debouncedSearch(value)
      advanceTime(DEBOUNCE_SEARCH_MS)
      expect(searchQuery).toHaveBeenLastCalledWith({ variables: { searchTerm: value } })
    })

    it.each(['', 'ab', '  ab  '])(
      'restores the unfiltered list once when returning to %j',
      (value) => {
        const searchQuery = jest.fn()
        const { result } = renderHook(() => useDebouncedSearch(searchQuery))

        result.current.debouncedSearch('abc')
        advanceTime(DEBOUNCE_SEARCH_MS)
        result.current.debouncedSearch(value)
        advanceTime(DEBOUNCE_SEARCH_MS)
        result.current.debouncedSearch('a')
        advanceTime(DEBOUNCE_SEARCH_MS)

        expect(searchQuery).toHaveBeenCalledTimes(3)
        expect(searchQuery).toHaveBeenLastCalledWith({ variables: { searchTerm: undefined } })
      },
    )

    it('does not repeat the same search term', () => {
      const searchQuery = jest.fn()
      const { result } = renderHook(() => useDebouncedSearch(searchQuery))

      result.current.debouncedSearch('abc')
      advanceTime(DEBOUNCE_SEARCH_MS)
      result.current.debouncedSearch('abc')
      advanceTime(DEBOUNCE_SEARCH_MS)
      expect(searchQuery).toHaveBeenCalledTimes(2)
    })
  })

  describe('minimum spinner duration', () => {
    it('keeps a fast request visible for the remaining interval, including a start time of zero', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useDebouncedSearch(undefined, loading),
        {
          initialProps: { loading: true },
        },
      )

      advanceTime(100)
      rerender({ loading: false })
      advanceTime(DEBOUNCE_SEARCH_MS - 101)
      expect(result.current.isLoading).toBe(true)
      advanceTime(1)
      expect(result.current.isLoading).toBe(false)
    })

    it('stays visible for a slow request and stops as soon as the request finishes', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useDebouncedSearch(undefined, loading),
        {
          initialProps: { loading: true },
        },
      )

      advanceTime(DEBOUNCE_SEARCH_MS + 100)
      expect(result.current.isLoading).toBe(true)
      rerender({ loading: false })
      expect(result.current.isLoading).toBe(false)
    })

    it('cancels an old hide timer when another request starts', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useDebouncedSearch(undefined, loading),
        {
          initialProps: { loading: true },
        },
      )

      advanceTime(100)
      rerender({ loading: false })
      advanceTime(100)
      rerender({ loading: true })
      expect(jest.getTimerCount()).toBe(0)
      advanceTime(100)
      rerender({ loading: false })
      advanceTime(DEBOUNCE_SEARCH_MS - 101)
      expect(result.current.isLoading).toBe(true)
      advanceTime(1)
      expect(result.current.isLoading).toBe(false)
    })
  })
})
