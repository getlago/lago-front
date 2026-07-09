import {
  getPageRange,
  getScrollableAncestor,
  shouldRenderFooter,
} from '~/components/designSystem/Pagination/utils'

describe('Pagination/utils', () => {
  describe('getPageRange', () => {
    describe('GIVEN a page in the middle of the collection', () => {
      describe('WHEN computing the range', () => {
        it.each([
          // currentPage, pageSize, totalCount, startNumber, endNumber
          [1, 20, 45, 1, 20],
          [2, 20, 45, 21, 40],
          [1, 50, 130, 1, 50],
          [3, 50, 130, 101, 130],
        ])(
          'THEN page %i at size %i over %i items → %i-%i',
          (currentPage, pageSize, totalCount, startNumber, endNumber) => {
            expect(getPageRange({ currentPage, pageSize, totalCount })).toEqual({
              startNumber,
              endNumber,
            })
          },
        )
      })
    })

    describe('GIVEN the last page is not full', () => {
      describe('WHEN computing the range', () => {
        it('THEN should clamp the end to totalCount', () => {
          expect(getPageRange({ currentPage: 3, pageSize: 20, totalCount: 45 })).toEqual({
            startNumber: 41,
            endNumber: 45,
          })
        })
      })
    })

    describe('GIVEN a single, partially-filled page', () => {
      describe('WHEN computing the range', () => {
        it('THEN start is 1 and end is the total', () => {
          expect(getPageRange({ currentPage: 1, pageSize: 20, totalCount: 7 })).toEqual({
            startNumber: 1,
            endNumber: 7,
          })
        })
      })
    })

    describe('GIVEN an empty collection', () => {
      describe('WHEN computing the range', () => {
        it('THEN end is clamped to 0 (start still 1)', () => {
          expect(getPageRange({ currentPage: 1, pageSize: 20, totalCount: 0 })).toEqual({
            startNumber: 1,
            endNumber: 0,
          })
        })
      })
    })
  })

  describe('shouldRenderFooter', () => {
    describe('GIVEN there is no rows-per-page menu', () => {
      describe('WHEN there is more than one page', () => {
        it('THEN the footer renders', () => {
          expect(
            shouldRenderFooter({
              hasPageSizeMenu: false,
              totalCount: 45,
              pageSizeOptions: [20, 50, 100],
              totalPages: 3,
            }),
          ).toBe(true)
        })
      })

      describe('WHEN there is a single page or none', () => {
        it.each([1, 0])('THEN the footer is hidden (totalPages = %i)', (totalPages) => {
          expect(
            shouldRenderFooter({
              hasPageSizeMenu: false,
              totalCount: 12,
              pageSizeOptions: [20, 50, 100],
              totalPages,
            }),
          ).toBe(false)
        })
      })
    })

    describe('GIVEN a rows-per-page menu is present', () => {
      describe('WHEN the total exceeds the smallest page-size option', () => {
        it('THEN the footer renders even on a single page (so the menu stays reachable)', () => {
          expect(
            shouldRenderFooter({
              hasPageSizeMenu: true,
              totalCount: 35,
              pageSizeOptions: [20, 50, 100],
              totalPages: 1,
            }),
          ).toBe(true)
        })
      })

      describe('WHEN even the smallest option would show everything', () => {
        it.each([20, 15])(
          'THEN the footer is hidden (totalCount = %i ≤ smallest option)',
          (totalCount) => {
            expect(
              shouldRenderFooter({
                hasPageSizeMenu: true,
                totalCount,
                pageSizeOptions: [20, 50, 100],
                totalPages: 1,
              }),
            ).toBe(false)
          },
        )
      })

      describe('WHEN the options are unordered', () => {
        it('THEN the smallest option is used regardless of order', () => {
          expect(
            shouldRenderFooter({
              hasPageSizeMenu: true,
              totalCount: 25,
              pageSizeOptions: [100, 20, 50],
              totalPages: 1,
            }),
          ).toBe(true)
        })
      })
    })
  })

  describe('getScrollableAncestor', () => {
    const makeElement = ({
      overflowY,
      scrollHeight,
      clientHeight,
    }: {
      overflowY: string
      scrollHeight: number
      clientHeight: number
    }): HTMLElement => {
      const el = document.createElement('div')

      el.style.overflowY = overflowY
      Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
      Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })

      return el
    }

    describe('GIVEN no node is provided', () => {
      describe('WHEN resolving the ancestor', () => {
        it('THEN returns null', () => {
          expect(getScrollableAncestor(null)).toBeNull()
        })
      })
    })

    describe('GIVEN a node with no scrollable ancestor', () => {
      describe('WHEN the parent does not overflow', () => {
        it('THEN returns null', () => {
          const parent = makeElement({
            overflowY: 'visible',
            scrollHeight: 1000,
            clientHeight: 300,
          })
          const child = document.createElement('div')

          parent.appendChild(child)

          expect(getScrollableAncestor(child)).toBeNull()
        })
      })

      describe('WHEN an ancestor is scrollable by style but its content fits', () => {
        it('THEN returns null (scrollHeight not greater than clientHeight)', () => {
          const parent = makeElement({ overflowY: 'auto', scrollHeight: 300, clientHeight: 300 })
          const child = document.createElement('div')

          parent.appendChild(child)

          expect(getScrollableAncestor(child)).toBeNull()
        })
      })
    })

    describe('GIVEN a scrollable ancestor exists', () => {
      describe('WHEN the nearest overflowing ancestor uses overflow-y auto', () => {
        it('THEN returns that ancestor', () => {
          const scroller = makeElement({ overflowY: 'auto', scrollHeight: 1000, clientHeight: 300 })
          const child = document.createElement('div')

          scroller.appendChild(child)

          expect(getScrollableAncestor(child)).toBe(scroller)
        })
      })

      describe('WHEN a non-scrollable parent sits between the node and the scroller', () => {
        it('THEN skips the parent and returns the scrollable grandparent', () => {
          const scroller = makeElement({
            overflowY: 'scroll',
            scrollHeight: 1000,
            clientHeight: 300,
          })
          const parent = makeElement({
            overflowY: 'visible',
            scrollHeight: 1000,
            clientHeight: 300,
          })
          const child = document.createElement('div')

          scroller.appendChild(parent)
          parent.appendChild(child)

          expect(getScrollableAncestor(child)).toBe(scroller)
        })
      })
    })
  })
})
