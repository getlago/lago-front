import {
  AvailableFiltersEnum,
  mapFilterToPanelTranslationKey,
  mapFilterToTranslationKey,
} from '~/components/Filters/presentation/types'

const CATEGORY_FILTERS: AvailableFiltersEnum[] = [
  AvailableFiltersEnum.productProductCategory,
  AvailableFiltersEnum.productFilterProductCategory,
  AvailableFiltersEnum.rateCardProductCategory,
]

describe('Filters label maps', () => {
  describe('GIVEN a product category filter', () => {
    describe('WHEN resolving its label outside the panel', () => {
      it.each(CATEGORY_FILTERS)('THEN %s should read "Product category"', (filter) => {
        expect(mapFilterToTranslationKey(filter)).toBe('text_1786374750349h8y80oq55h9')
      })
    })

    describe('WHEN resolving its label inside the panel', () => {
      it.each(CATEGORY_FILTERS)('THEN %s should read "Category"', (filter) => {
        expect(mapFilterToPanelTranslationKey(filter)).toBe('text_1766047828726zeybs9mgzhl')
      })
    })
  })

  describe('GIVEN a filter with no panel override', () => {
    describe('WHEN resolving its label inside the panel', () => {
      it.each([
        AvailableFiltersEnum.rateCardProduct,
        AvailableFiltersEnum.rateCardProductFilter,
        AvailableFiltersEnum.status,
      ])('THEN %s should fall back to the shared label', (filter) => {
        expect(mapFilterToPanelTranslationKey(filter)).toBe(mapFilterToTranslationKey(filter))
      })
    })
  })

  describe('GIVEN an unmapped filter', () => {
    describe('WHEN resolving its label', () => {
      it('THEN should fall back to the filter name itself', () => {
        expect(mapFilterToTranslationKey('unknown' as AvailableFiltersEnum)).toBe('unknown')
        expect(mapFilterToPanelTranslationKey('unknown' as AvailableFiltersEnum)).toBe('unknown')
      })
    })
  })
})
