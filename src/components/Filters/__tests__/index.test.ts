import { AvailableFiltersEnum, Filters, formatFiltersForQuery } from '~/components/Filters'

describe('Filters barrel', () => {
  describe('GIVEN the public barrel is imported', () => {
    describe('WHEN accessing the Filters namespace', () => {
      it.each([['Provider'], ['Component'], ['QuickFilters']])(
        'THEN should expose the %s component',
        (key) => {
          expect(Filters[key as keyof typeof Filters]).toBeDefined()
        },
      )
    })

    describe('WHEN accessing re-exported symbols', () => {
      it('THEN should expose the AvailableFiltersEnum', () => {
        expect(AvailableFiltersEnum.status).toBe('status')
      })

      it('THEN should expose the query formatting helpers', () => {
        expect(typeof formatFiltersForQuery).toBe('function')
      })
    })
  })
})
