import { filterWithoutProductFilterValue } from '~/components/Filters/presentation/types'
import { InvoiceProductCatalogSectionFragment, ProductTypeEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  buildInvoiceProductFeesDynamicFilters,
  buildInvoiceProductFeesProductFilterOptions,
  buildInvoiceProductFeesProductOptions,
  formatInvoiceProductFeesFilters,
  INVOICE_PRODUCT_FEES_PRODUCT_FILTER_FILTER_KEY,
  INVOICE_PRODUCT_FEES_PRODUCT_FILTER_KEY,
} from '../invoiceProductFeesFilters'

const NOT_DEFINED_LABEL = 'Not defined'
const translate: TranslateFunc = () => NOT_DEFINED_LABEL

const product = (id: string, code: string) => ({
  id,
  code,
  name: `${code} name`,
  productType: ProductTypeEnum.Fixed,
})

const filterGroup = (id: string, name: string, invoiceDisplayName?: string | null) => ({
  amountCents: '0',
  feesCount: 1,
  productFilter: { id, code: id, name, invoiceDisplayName },
})

const section: InvoiceProductCatalogSectionFragment = {
  productCategory: null,
  products: [
    {
      amountCents: '0',
      feesCount: 1,
      product: product('p-zeta', 'zeta'),
      filters: [filterGroup('f-small', 'Small', 'Tiny'), filterGroup('f-big', 'Big')],
    },
    {
      amountCents: '0',
      feesCount: 1,
      product: product('p-alpha', 'alpha'),
      filters: [filterGroup('f-big', 'Big')],
    },
    {
      amountCents: '0',
      feesCount: 1,
      product: product('p-alpha', 'alpha'),
      filters: [],
    },
  ],
}

describe('formatInvoiceProductFeesFilters', () => {
  describe('GIVEN products selected in the URL', () => {
    it('THEN should send their ids only', () => {
      expect(
        formatInvoiceProductFeesFilters(
          new URLSearchParams('ipf_dynamic.product=p1|-_-|Alpha,p2|-_-|Beta'),
        ),
      ).toEqual({ productIds: ['p1', 'p2'] })
    })
  })

  describe('GIVEN product filters selected in the URL', () => {
    it('THEN should split the not defined option from the real ids', () => {
      expect(
        formatInvoiceProductFeesFilters(
          new URLSearchParams(
            `ipf_dynamic.productFilter=${filterWithoutProductFilterValue},f1|-_-|Big`,
          ),
        ),
      ).toEqual({ productFilterIds: ['f1'], withoutProductFilter: true })
    })

    it('THEN should send no productFilterIds when only not defined is selected', () => {
      const filters = formatInvoiceProductFeesFilters(
        new URLSearchParams(`ipf_dynamic.productFilter=${filterWithoutProductFilterValue}`),
      )

      expect(filters).toEqual({ withoutProductFilter: true })
      expect(filters).not.toHaveProperty('productFilterIds')
    })
  })

  describe('GIVEN a product type selected in the URL', () => {
    it('THEN should send it as productType', () => {
      expect(
        formatInvoiceProductFeesFilters(
          new URLSearchParams('ipf_appliedRateCardProductType=metered'),
        ),
      ).toEqual({ productType: ProductTypeEnum.Metered })
    })
  })

  describe('GIVEN no fees filter in the URL', () => {
    it.each([
      ['an empty URL', ''],
      ['keys of other lists and the page', 'in_currency=USD&page=2&section=c1%3Astandalone'],
    ])('THEN should ignore %s', (_, search) => {
      expect(formatInvoiceProductFeesFilters(new URLSearchParams(search))).toEqual({})
    })
  })
})

describe('buildInvoiceProductFeesProductOptions', () => {
  describe('GIVEN a section with the same product in several groups', () => {
    it('THEN should list each product once, labelled and sorted by code', () => {
      expect(buildInvoiceProductFeesProductOptions(section.products)).toEqual([
        { label: 'alpha', value: 'p-alpha|-_-|alpha' },
        { label: 'zeta', value: 'p-zeta|-_-|zeta' },
      ])
    })
  })
})

describe('buildInvoiceProductFeesProductFilterOptions', () => {
  describe('GIVEN a section with product filters', () => {
    it('THEN should pin not defined first and list each filter once by display label', () => {
      expect(buildInvoiceProductFeesProductFilterOptions(section.products, translate)).toEqual([
        { label: NOT_DEFINED_LABEL, value: filterWithoutProductFilterValue },
        { label: 'Big', value: 'f-big|-_-|Big' },
        { label: 'Tiny', value: 'f-small|-_-|Tiny' },
      ])
    })
  })

  describe('GIVEN a section without products', () => {
    it('THEN should only offer not defined', () => {
      expect(buildInvoiceProductFeesProductFilterOptions([], translate)).toEqual([
        { label: NOT_DEFINED_LABEL, value: filterWithoutProductFilterValue },
      ])
    })
  })
})

describe('buildInvoiceProductFeesDynamicFilters', () => {
  const filters = buildInvoiceProductFeesDynamicFilters({
    products: section.products,
    translate,
  })
  const getFilter = (key: string) => filters.find((filter) => filter.key === key)

  it('THEN should expose the product and product filter dynamic keys', () => {
    expect(filters.map(({ key }) => key)).toEqual([
      INVOICE_PRODUCT_FEES_PRODUCT_FILTER_KEY,
      INVOICE_PRODUCT_FEES_PRODUCT_FILTER_FILTER_KEY,
    ])
  })

  describe('WHEN formatting an active product value', () => {
    it('THEN should show the selected codes', () => {
      expect(
        getFilter(INVOICE_PRODUCT_FEES_PRODUCT_FILTER_KEY)?.formatValue('p1|-_-|alpha,p2|-_-|zeta'),
      ).toBe('alpha, zeta')
    })
  })

  describe('WHEN formatting an active product filter value with not defined', () => {
    it('THEN should show the translated not defined label', () => {
      expect(
        getFilter(INVOICE_PRODUCT_FEES_PRODUCT_FILTER_FILTER_KEY)?.formatValue(
          `${filterWithoutProductFilterValue},f1|-_-|Big`,
        ),
      ).toBe(`${NOT_DEFINED_LABEL}, Big`)
    })
  })
})
