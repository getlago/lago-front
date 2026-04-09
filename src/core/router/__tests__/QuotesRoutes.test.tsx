import { QUOTES_LIST_ROUTE, quotesRoutes } from '../QuotesRoutes'

describe('QuotesRoutes', () => {
  describe('route constants', () => {
    it('defines the quotes list route path', () => {
      expect(QUOTES_LIST_ROUTE).toBe('/quotes')
    })
  })

  describe('quotesRoutes array', () => {
    it('contains expected number of route definitions', () => {
      expect(quotesRoutes).toHaveLength(1)
    })

    it('all routes are marked as private', () => {
      quotesRoutes.forEach((route) => {
        expect(route.private).toBe(true)
      })
    })

    it('quotes list route has the correct path', () => {
      const quotesListRoute = quotesRoutes.find((r) => r.path === QUOTES_LIST_ROUTE)

      expect(quotesListRoute).toBeDefined()
    })

    it('all routes have an element defined', () => {
      quotesRoutes.forEach((route) => {
        expect(route.element).toBeDefined()
      })
    })
  })
})
