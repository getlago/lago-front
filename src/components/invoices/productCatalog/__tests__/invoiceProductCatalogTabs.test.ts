import { InvoiceProductCatalogContractFragment } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { buildInvoiceProductCatalogTabs } from '../invoiceProductCatalogTabs'
import { buildInvoiceProductCatalogSections } from '../useInvoiceProductFees'

const STANDALONE_LABEL = 'Standalone products'

const translate: TranslateFunc = jest.fn((_key, data) =>
  data ? `${data.contract} - ${data.category}` : STANDALONE_LABEL,
)

const category = (id: string, name: string, invoiceDisplayName?: string | null) => ({
  id,
  code: id,
  name,
  invoiceDisplayName,
})

const buildTabs = (contracts: InvoiceProductCatalogContractFragment[]) =>
  buildInvoiceProductCatalogTabs(buildInvoiceProductCatalogSections(contracts), translate)

describe('buildInvoiceProductCatalogTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a single contract', () => {
    describe('WHEN it has a category and a standalone section', () => {
      it('THEN should label the category by display name and the standalone tab last', () => {
        const tabs = buildTabs([
          {
            contract: { id: 'c1', externalId: 'c1-external', name: 'Acme' },
            productCatalogSections: [
              { productCategory: category('catA', 'Category A', 'A'), products: [] },
              { productCategory: null, products: [] },
            ],
          },
        ])

        expect(tabs).toEqual([
          { key: 'c1:catA', label: 'A' },
          { key: 'c1:standalone', label: STANDALONE_LABEL },
        ])
      })
    })

    describe('WHEN the category has no invoice display name', () => {
      it('THEN should fall back to the category name', () => {
        const tabs = buildTabs([
          {
            contract: { id: 'c1', externalId: 'c1-external', name: 'Acme' },
            productCatalogSections: [
              { productCategory: category('catA', 'Category A', null), products: [] },
            ],
          },
        ])

        expect(tabs).toEqual([{ key: 'c1:catA', label: 'Category A' }])
      })
    })

    describe('WHEN it has a single section', () => {
      it('THEN should return a single tab', () => {
        const tabs = buildTabs([
          {
            contract: { id: 'c1', externalId: 'c1-external', name: 'Acme' },
            productCatalogSections: [{ productCategory: null, products: [] }],
          },
        ])

        expect(tabs).toHaveLength(1)
      })
    })
  })

  describe('GIVEN several contracts', () => {
    describe('WHEN no section has a category', () => {
      it('THEN should label each tab with the contract name, its plan, then its external id', () => {
        const tabs = buildTabs([
          {
            contract: {
              id: 'c1',
              externalId: 'c1-external',
              name: null,
              plan: { id: 'p1', name: 'Plan', invoiceDisplayName: 'Gold' },
            },
            productCatalogSections: [{ productCategory: null, products: [] }],
          },
          {
            contract: {
              id: 'c2',
              externalId: 'c2-external',
              name: null,
              plan: { id: 'p2', name: 'Silver' },
            },
            productCatalogSections: [{ productCategory: null, products: [] }],
          },
          {
            contract: { id: 'c3', externalId: 'c3-external', name: 'Acme' },
            productCatalogSections: [{ productCategory: null, products: [] }],
          },
          {
            contract: { id: 'c4', externalId: 'contract-without-name', name: null, plan: null },
            productCatalogSections: [{ productCategory: null, products: [] }],
          },
        ])

        expect(tabs.map(({ label }) => label)).toEqual([
          'Gold',
          'Silver',
          'Acme',
          'contract-without-name',
        ])
      })
    })

    describe('WHEN at least one section has a category', () => {
      it('THEN should label every tab with the contract and the category', () => {
        const tabs = buildTabs([
          {
            contract: { id: 'c1', externalId: 'c1-external', name: 'Acme' },
            productCatalogSections: [
              { productCategory: category('catA', 'Category A', 'A'), products: [] },
              { productCategory: null, products: [] },
            ],
          },
          {
            contract: { id: 'c2', externalId: 'c2-external', name: 'Globex' },
            productCatalogSections: [{ productCategory: null, products: [] }],
          },
        ])

        expect(tabs).toEqual([
          { key: 'c1:catA', label: 'Acme - A' },
          { key: 'c1:standalone', label: `Acme - ${STANDALONE_LABEL}` },
          { key: 'c2:standalone', label: `Globex - ${STANDALONE_LABEL}` },
        ])
        expect(translate).toHaveBeenCalledWith(expect.any(String), {
          contract: 'Acme',
          category: 'A',
        })
      })
    })
  })
})
