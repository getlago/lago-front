import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { GetContractUsageCategoriesDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { useContractUsageCategories } from '../useContractUsageCategories'

type CardFixture = {
  id: string
  product: { id: string; name: string; invoiceDisplayName?: string | null }
  category?: { id: string; name: string; invoiceDisplayName?: string | null }
  productFilter?: { id: string; name: string; invoiceDisplayName?: string | null }
}

const buildCard = ({ id, product, category, productFilter }: CardFixture): unknown => ({
  id,
  __typename: 'ContractAppliedRateCard',
  product: {
    __typename: 'Product',
    id: product.id,
    name: product.name,
    invoiceDisplayName: product.invoiceDisplayName ?? null,
    productCategory: category
      ? {
          __typename: 'ProductCategory',
          id: category.id,
          name: category.name,
          invoiceDisplayName: category.invoiceDisplayName ?? null,
        }
      : null,
  },
  rateCard: {
    __typename: 'RateCard',
    id: `rate-card-${id}`,
    productFilter: productFilter
      ? {
          __typename: 'ProductFilter',
          id: productFilter.id,
          name: productFilter.name,
          invoiceDisplayName: productFilter.invoiceDisplayName ?? null,
        }
      : null,
  },
})

const buildMock = (cards: CardFixture[]): TestMocksType[number] => ({
  request: { query: GetContractUsageCategoriesDocument, variables: { contractId: 'contract-1' } },
  result: {
    data: {
      contract: {
        id: 'contract-1',
        __typename: 'Contract',
        appliedRateCards: cards.map(buildCard),
      },
    },
  },
})

const support = { id: 'cat-1', name: 'Support' }

const renderCategories = (mocks: TestMocksType, refreshToken?: number) =>
  renderHook(
    ({ token }: { token?: number }) =>
      useContractUsageCategories({ contractId: 'contract-1', refreshToken: token }),
    {
      initialProps: { token: refreshToken },
      wrapper: ({ children }: { children: ReactNode }) => (
        <AllTheProviders forceTypenames mocks={mocks}>
          {children}
        </AllTheProviders>
      ),
    },
  )

describe('useContractUsageCategories', () => {
  describe('GIVEN rate cards spread over categories', () => {
    it('THEN returns each category once', async () => {
      const { result } = renderCategories([
        buildMock([
          { id: 'a1', product: { id: 'p1', name: 'Seats' }, category: support },
          { id: 'a2', product: { id: 'p2', name: 'Chat' }, category: support },
        ]),
      ])

      await waitFor(() => expect(result.current.isResolved).toBe(true))

      expect(result.current.categories.map(({ id }) => id)).toEqual(['cat-1'])
    })

    it('THEN sorts them by name, numeric suffixes numerically', async () => {
      const { result } = renderCategories([
        buildMock([
          { id: 'a1', product: { id: 'p1', name: 'A' }, category: { id: 'c10', name: 'Tier 10' } },
          { id: 'a2', product: { id: 'p2', name: 'B' }, category: { id: 'c2', name: 'Tier 2' } },
          { id: 'a3', product: { id: 'p3', name: 'C' }, category: { id: 'ca', name: 'Compute' } },
        ]),
      ])

      await waitFor(() => expect(result.current.isResolved).toBe(true))

      expect(result.current.categories.map(({ name }) => name)).toEqual([
        'Compute',
        'Tier 2',
        'Tier 10',
      ])
    })

    it('THEN prefers the invoice display name as the display name', async () => {
      const { result } = renderCategories([
        buildMock([
          {
            id: 'a1',
            product: { id: 'p1', name: 'Seats' },
            category: { ...support, invoiceDisplayName: 'Premium support' },
          },
        ]),
      ])

      await waitFor(() => expect(result.current.isResolved).toBe(true))

      expect(result.current.categories[0]).toEqual({
        id: 'cat-1',
        name: 'Support',
        displayName: 'Premium support',
      })
    })
  })

  describe('GIVEN whether a product sits outside every category', () => {
    it('THEN reports standalone products when one does', async () => {
      const { result } = renderCategories([
        buildMock([
          { id: 'a1', product: { id: 'p1', name: 'Seats' }, category: support },
          { id: 'a2', product: { id: 'p2', name: 'Platform fee' } },
        ]),
      ])

      await waitFor(() => expect(result.current.isResolved).toBe(true))

      expect(result.current.hasStandaloneProducts).toBe(true)
    })

    it('THEN reports none when every product has a category', async () => {
      const { result } = renderCategories([
        buildMock([{ id: 'a1', product: { id: 'p1', name: 'Seats' }, category: support }]),
      ])

      await waitFor(() => expect(result.current.isResolved).toBe(true))

      expect(result.current.hasStandaloneProducts).toBe(false)
    })
  })

  describe('GIVEN the filter options of a view', () => {
    const cards: CardFixture[] = [
      {
        id: 'a1',
        product: { id: 'p1', name: 'Seats', invoiceDisplayName: 'Team seats' },
        category: support,
        productFilter: { id: 'f1', name: 'EU' },
      },
      {
        id: 'a2',
        product: { id: 'p1', name: 'Seats', invoiceDisplayName: 'Team seats' },
        category: support,
        productFilter: { id: 'f2', name: 'US', invoiceDisplayName: 'United States' },
      },
      { id: 'a3', product: { id: 'p2', name: 'Platform fee' } },
    ]

    it('THEN lists only the products and product filters of that category, once each', async () => {
      const { result } = renderCategories([buildMock(cards)])

      await waitFor(() => expect(result.current.isResolved).toBe(true))

      expect(result.current.getFilterOptions('cat-1')).toEqual({
        products: [{ id: 'p1', label: 'Team seats' }],
        productFilters: [
          { id: 'f1', label: 'EU' },
          { id: 'f2', label: 'United States' },
        ],
      })
    })

    it('THEN lists the standalone products for the Standalone view', async () => {
      const { result } = renderCategories([buildMock(cards)])

      await waitFor(() => expect(result.current.isResolved).toBe(true))

      expect(result.current.getFilterOptions(null)).toEqual({
        products: [{ id: 'p2', label: 'Platform fee' }],
        productFilters: [],
      })
    })

    it('THEN returns nothing before the contract has loaded', () => {
      const { result } = renderCategories([buildMock(cards)])

      expect(result.current.isResolved).toBe(false)
      expect(result.current.getFilterOptions('cat-1')).toBeUndefined()
    })
  })

  describe('GIVEN the query fails', () => {
    it('THEN resolves with an error and no category', async () => {
      const { result } = renderCategories([
        {
          request: {
            query: GetContractUsageCategoriesDocument,
            variables: { contractId: 'contract-1' },
          },
          error: new Error('boom'),
        },
      ])

      await waitFor(() => expect(result.current.hasError).toBe(true))

      expect(result.current.isResolved).toBe(true)
      expect(result.current.categories).toEqual([])
      expect(result.current.getFilterOptions(null)).toBeUndefined()
    })
  })

  describe('WHEN the refresh token changes', () => {
    it('THEN refetches the categories', async () => {
      const { result, rerender } = renderCategories(
        [
          buildMock([]),
          buildMock([{ id: 'a1', product: { id: 'p1', name: 'Seats' }, category: support }]),
        ],
        0,
      )

      await waitFor(() => expect(result.current.isResolved).toBe(true))
      expect(result.current.categories).toEqual([])

      rerender({ token: 1 })

      await waitFor(() => expect(result.current.categories).toHaveLength(1))
    })
  })
})
