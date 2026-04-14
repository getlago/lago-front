import { renderHook } from '@testing-library/react'

import { useGetQuotesLazyQuery } from '~/generated/graphql'

import { useQuotes } from '../useQuotes'

jest.mock('~/generated/graphql', () => ({
  useGetQuotesLazyQuery: jest.fn(),
}))

const mockUseGetQuotesLazyQuery = useGetQuotesLazyQuery as jest.Mock

describe('useQuotes', () => {
  const mockGetQuotes = jest.fn()
  const mockFetchMore = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetQuotesLazyQuery.mockReturnValue([
      mockGetQuotes,
      {
        data: undefined,
        loading: false,
        error: undefined,
        fetchMore: mockFetchMore,
      },
    ])
  })

  describe('GIVEN the hook is rendered', () => {
    it('THEN should call getQuotes on mount', () => {
      renderHook(() => useQuotes())

      expect(mockGetQuotes).toHaveBeenCalled()
    })

    it('THEN should pass limit of 20 as default', () => {
      renderHook(() => useQuotes())

      expect(mockUseGetQuotesLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ limit: 20 }),
        }),
      )
    })
  })

  describe('GIVEN custom variables are provided', () => {
    it('THEN should merge them with defaults', () => {
      renderHook(() => useQuotes({ latestVersionOnly: true, number: 'QT-001' }))

      expect(mockUseGetQuotesLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            limit: 20,
            latestVersionOnly: true,
            number: 'QT-001',
          }),
        }),
      )
    })
  })

  describe('GIVEN the query returns data', () => {
    it('THEN should return the quotes collection', () => {
      const mockQuotes = [
        { id: 'q1', number: 'QT-001' },
        { id: 'q2', number: 'QT-002' },
      ]

      mockUseGetQuotesLazyQuery.mockReturnValue([
        mockGetQuotes,
        {
          data: {
            quotes: {
              collection: mockQuotes,
              metadata: { currentPage: 1, totalPages: 2, totalCount: 10 },
            },
          },
          loading: false,
          error: undefined,
          fetchMore: mockFetchMore,
        },
      ])

      const { result } = renderHook(() => useQuotes())

      expect(result.current.quotes).toEqual(mockQuotes)
      expect(result.current.metadata).toEqual({
        currentPage: 1,
        totalPages: 2,
        totalCount: 10,
      })
    })
  })

  describe('GIVEN the query has no data yet', () => {
    it('THEN should return an empty array for quotes', () => {
      const { result } = renderHook(() => useQuotes())

      expect(result.current.quotes).toEqual([])
      expect(result.current.metadata).toBeUndefined()
    })
  })

  describe('GIVEN the query is loading', () => {
    it('THEN should return loading true', () => {
      mockUseGetQuotesLazyQuery.mockReturnValue([
        mockGetQuotes,
        {
          data: undefined,
          loading: true,
          error: undefined,
          fetchMore: mockFetchMore,
        },
      ])

      const { result } = renderHook(() => useQuotes())

      expect(result.current.loading).toBe(true)
    })
  })
})
