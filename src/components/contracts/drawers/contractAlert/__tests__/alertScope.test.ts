import { ContractAlertTypeEnum, ProductTypeEnum } from '~/generated/graphql'

import {
  deriveContractScopeOptions,
  getLockedWithProductFilters,
  getTakenScopeKeys,
  isFilterDisabled,
  isProductDisabled,
  isWholeContractTaken,
  toScopeKey,
} from '../alertScope'

const UNITS = ContractAlertTypeEnum.UsageUnits
const AMOUNT = ContractAlertTypeEnum.UsageAmount

const product = (code: string, productType = ProductTypeEnum.Metered) => ({
  id: `id-${code}`,
  name: `Product ${code}`,
  code,
  productType,
  productCategory: null,
})

const filter = (code: string) => ({ code, name: `Filter ${code}` })

const rateCard = (productCode: string, productType?: ProductTypeEnum, filterId?: string) => ({
  product: product(productCode, productType),
  rateCard: { productFilter: filterId ? filter(filterId) : null },
})

const taken = (...keys: Array<[string, string | null, string | null, boolean]>): Set<string> =>
  new Set(
    keys.map(([alertType, productCode, productFilterCode, withProductFilters]) =>
      toScopeKey({ alertType, productCode, productFilterCode, withProductFilters }),
    ),
  )

describe('alertScope', () => {
  describe('GIVEN applied rate cards of a contract', () => {
    const appliedRateCards = [
      rateCard('X', ProductTypeEnum.Fixed),
      rateCard('P', undefined, 'F1'),
      rateCard('P', undefined, 'F1'),
      rateCard('P', undefined, 'F2'),
      rateCard('P'),
      rateCard('Q'),
    ]

    describe('WHEN deriving the scope options', () => {
      it('THEN should keep unique metered products only', () => {
        const { products } = deriveContractScopeOptions(appliedRateCards)

        expect(products.map(({ code }) => code)).toEqual(['P', 'Q'])
      })

      it('THEN should list the unique priced filters per product', () => {
        const { filtersByProduct } = deriveContractScopeOptions(appliedRateCards)

        expect(filtersByProduct.P.map(({ code }) => code)).toEqual(['F1', 'F2'])
        expect(filtersByProduct.Q).toBeUndefined()
      })
    })

    describe('WHEN the edited alert scope is no longer priced', () => {
      it('THEN should append its own product and filter', () => {
        const { products, filtersByProduct } = deriveContractScopeOptions(appliedRateCards, {
          product: product('Z'),
          productFilters: [filter('FZ')],
        })

        expect(products.map(({ code }) => code)).toEqual(['P', 'Q', 'Z'])
        expect(filtersByProduct.Z.map(({ code }) => code)).toEqual(['FZ'])
      })

      it('THEN should not duplicate an own scope still priced', () => {
        const { products, filtersByProduct } = deriveContractScopeOptions(appliedRateCards, {
          product: product('P'),
          productFilters: [filter('F1')],
        })

        expect(products.map(({ code }) => code)).toEqual(['P', 'Q'])
        expect(filtersByProduct.P.map(({ code }) => code)).toEqual(['F1', 'F2'])
      })
    })
  })

  describe('GIVEN existing alerts', () => {
    describe('WHEN building the taken keys', () => {
      it('THEN should encode the full 4-tuple of each alert', () => {
        const keys = getTakenScopeKeys([
          {
            alertType: UNITS,
            scope: [
              {
                withProductFilters: null,
                product: { code: 'P' },
                productFilters: [{ code: 'F1' }],
              },
            ],
          },
          {
            alertType: UNITS,
            scope: [{ withProductFilters: true, product: { code: 'Q' }, productFilters: null }],
          },
          { alertType: AMOUNT, scope: [] },
        ])

        expect(keys).toEqual(
          taken([UNITS, 'P', 'F1', false], [UNITS, 'Q', null, true], [AMOUNT, null, null, false]),
        )
      })
    })
  })

  describe('GIVEN taken scope keys', () => {
    describe('WHEN only P + F1 is taken', () => {
      const keys = taken([UNITS, 'P', 'F1', false])

      it('THEN should disable F1 but not F2', () => {
        expect(isFilterDisabled(keys, UNITS, 'P', 'F1')).toBe(true)
        expect(isFilterDisabled(keys, UNITS, 'P', 'F2')).toBe(false)
      })

      it('THEN should keep P enabled', () => {
        expect(isProductDisabled(keys, UNITS, 'P', ['F1', 'F2'])).toBe(false)
      })

      it('THEN should not disable F1 for the other alert type', () => {
        expect(isFilterDisabled(keys, AMOUNT, 'P', 'F1')).toBe(false)
      })
    })

    describe('WHEN both product-only keys and P + F1 are taken', () => {
      const keys = taken(
        [UNITS, 'P', 'F1', false],
        [UNITS, 'P', null, false],
        [UNITS, 'P', null, true],
      )

      it('THEN should keep P enabled while P + F2 is free', () => {
        expect(isProductDisabled(keys, UNITS, 'P', ['F1', 'F2'])).toBe(false)
      })

      it('THEN should disable P once every filter is taken too', () => {
        const allTaken = new Set([
          ...keys,
          toScopeKey({
            alertType: UNITS,
            productCode: 'P',
            productFilterCode: 'F2',
            withProductFilters: false,
          }),
        ])

        expect(isProductDisabled(allTaken, UNITS, 'P', ['F1', 'F2'])).toBe(true)
      })

      it('THEN should lock the checkbox off', () => {
        expect(getLockedWithProductFilters(keys, UNITS, 'P', ['F1', 'F2'])).toBe(false)
      })
    })

    describe('WHEN locking the "all filters" checkbox', () => {
      it.each([
        ['only the product-only key is taken', taken([UNITS, 'P', null, false]), true],
        ['only the all-filters key is taken', taken([UNITS, 'P', null, true]), false],
        ['neither is taken', taken(), undefined],
      ])('THEN %s', (_, keys, expected) => {
        expect(getLockedWithProductFilters(keys, UNITS, 'P', ['F1'])).toBe(expected)
      })
    })

    describe('WHEN the product has no filters', () => {
      it.each([
        ['the product-only key is taken', taken([UNITS, 'P', null, false])],
        ['the all-filters key is taken', taken([UNITS, 'P', null, true])],
      ])('THEN should disable the product once %s', (_, keys) => {
        expect(isProductDisabled(keys, UNITS, 'P', [])).toBe(true)
      })

      it('THEN should keep the product enabled while neither key is taken', () => {
        expect(isProductDisabled(taken(), UNITS, 'P', [])).toBe(false)
      })

      it('THEN should lock the checkbox off', () => {
        expect(getLockedWithProductFilters(taken(), UNITS, 'P', [])).toBe(false)
      })
    })

    describe('WHEN a whole-contract amount alert exists', () => {
      it('THEN should report the whole contract as taken', () => {
        expect(isWholeContractTaken(taken([AMOUNT, null, null, false]))).toBe(true)
      })

      it('THEN should not report it for a units alert', () => {
        expect(isWholeContractTaken(taken([UNITS, null, null, false]))).toBe(false)
      })
    })
  })
})
