import { createOrderFormsPaginationHandler } from '../orderFormsPaginationHandler'

describe('createOrderFormsPaginationHandler', () => {
  const mockFetchMore = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN there are more pages to load', () => {
    describe('WHEN the handler is called and not loading', () => {
      it('THEN should call fetchMore with the next page', () => {
        const handler = createOrderFormsPaginationHandler(
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
        const handler = createOrderFormsPaginationHandler(
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
    describe('WHEN the handler is called', () => {
      it('THEN should not call fetchMore', () => {
        const handler = createOrderFormsPaginationHandler(
          { currentPage: 3, totalPages: 3, totalCount: 60 },
          false,
          mockFetchMore,
        )

        handler()

        expect(mockFetchMore).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN metadata is undefined', () => {
    describe('WHEN the handler is called', () => {
      it('THEN should not call fetchMore', () => {
        const handler = createOrderFormsPaginationHandler(undefined, false, mockFetchMore)

        handler()

        expect(mockFetchMore).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN fetchMore is undefined', () => {
    describe('WHEN the handler is called', () => {
      it('THEN should not throw', () => {
        const handler = createOrderFormsPaginationHandler(
          { currentPage: 1, totalPages: 3, totalCount: 60 },
          false,
          undefined,
        )

        expect(() => handler()).not.toThrow()
      })
    })
  })
})
