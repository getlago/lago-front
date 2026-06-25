import { createOrdersPaginationHandler } from '../ordersPaginationHandler'

describe('createOrdersPaginationHandler', () => {
  const mockFetchMore = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN there are more pages to load', () => {
    describe('WHEN the handler is called and not loading', () => {
      it('THEN should call fetchMore with the next page', () => {
        const handler = createOrdersPaginationHandler(
          { currentPage: 1, totalPages: 3, totalCount: 60 },
          false,
          mockFetchMore,
        )

        handler()

        expect(mockFetchMore).toHaveBeenCalledWith({
          variables: { page: 2 },
        })
      })
    })

    describe('WHEN currently loading', () => {
      it('THEN should not call fetchMore', () => {
        const handler = createOrdersPaginationHandler(
          { currentPage: 1, totalPages: 3, totalCount: 60 },
          true,
          mockFetchMore,
        )

        handler()

        expect(mockFetchMore).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the current page is the last page', () => {
    it('THEN should not call fetchMore', () => {
      const handler = createOrdersPaginationHandler(
        { currentPage: 3, totalPages: 3, totalCount: 60 },
        false,
        mockFetchMore,
      )

      handler()

      expect(mockFetchMore).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN metadata is undefined', () => {
    it('THEN should not call fetchMore', () => {
      const handler = createOrdersPaginationHandler(undefined, false, mockFetchMore)

      handler()

      expect(mockFetchMore).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN fetchMore is undefined', () => {
    it('THEN should not throw', () => {
      const handler = createOrdersPaginationHandler(
        { currentPage: 1, totalPages: 3, totalCount: 60 },
        false,
        undefined,
      )

      expect(() => handler()).not.toThrow()
    })
  })
})
