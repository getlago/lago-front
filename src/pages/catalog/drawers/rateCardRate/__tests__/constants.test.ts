import { RATE_CARD_RATE_DEPENDENT_QUERIES } from '../constants'

describe('RATE_CARD_RATE_DEPENDENT_QUERIES', () => {
  describe('GIVEN a rate was deleted', () => {
    describe('WHEN the list refetches', () => {
      // Its own details query would answer 404, which is why the delete flow evicts from the
      // cache instead. Adding it here would reintroduce the delayed error toast.
      it('THEN the rate details query is not among the refetched ones', () => {
        expect(RATE_CARD_RATE_DEPENDENT_QUERIES).not.toContain('getRateCardRateForDetails')
      })

      it('THEN every surface counting rates is refetched', () => {
        expect(RATE_CARD_RATE_DEPENDENT_QUERIES).toEqual(
          expect.arrayContaining(['rateCardRates', 'getRateCardForDetails', 'rateCards']),
        )
      })
    })
  })
})
