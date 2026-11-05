import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache, Observable } from '@apollo/client'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'

import { queryFieldPolicies } from '~/core/apolloClient/cache'
import {
  GetInvoiceProductFeesQueryVariables,
  InvoiceProductCatalogContractFragment,
  ProductTypeEnum,
} from '~/generated/graphql'
import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'
import { testMockNavigateFn } from '~/test-utils'

import {
  buildInvoiceProductCatalogSections,
  resolveActiveSectionKey,
  useInvoiceProductFees,
} from '../useInvoiceProductFees'

const contracts: InvoiceProductCatalogContractFragment[] = ['c1', 'c2'].map((id) => ({
  contract: { id, name: id },
  productCatalogSections: [
    { productCategory: { id: 'catA', name: 'Category A', code: 'a' }, products: [] },
    { productCategory: null, products: [] },
  ],
}))
const sections = buildInvoiceProductCatalogSections(contracts)

describe('GIVEN invoice catalog sections', () => {
  it('THEN preserves contract and category order with standalone sections last', () => {
    expect(sections.map(({ key }) => key)).toEqual([
      'c1:catA',
      'c1:standalone',
      'c2:catA',
      'c2:standalone',
    ])
    expect(buildInvoiceProductCatalogSections([])).toEqual([])
    expect(resolveActiveSectionKey([], null)).toBeUndefined()
  })

  it.each([null, 'missing', 'c1:catA'])('THEN resolves %s to the first section', (key) => {
    expect(resolveActiveSectionKey(sections, key)).toBe('c1:catA')
  })

  it('THEN preserves a valid non-default section', () => {
    expect(resolveActiveSectionKey(sections, 'c2:standalone')).toBe('c2:standalone')
  })
})

describe('GIVEN the paginated fees hook', () => {
  let requests: GetInvoiceProductFeesQueryVariables[]
  let client: ApolloClient<unknown>

  beforeEach(() => {
    requests = []
    testMockNavigateFn.mockClear()
    client = new ApolloClient({
      cache: new InMemoryCache({ typePolicies: { Query: { fields: queryFieldPolicies } } }),
      link: new ApolloLink(
        (operation) =>
          new Observable((observer) => {
            requests.push(operation.variables as GetInvoiceProductFeesQueryVariables)
            observer.next({
              data: {
                invoiceProductFees: {
                  __typename: 'FeeCollection',
                  collection: [],
                  metadata: {
                    __typename: 'CollectionMetadata',
                    currentPage: operation.variables.page,
                    totalPages: 4,
                    totalCount: 350,
                  },
                },
              },
            })
            observer.complete()
          }),
      ),
    })
  })

  afterEach(() => client.stop())

  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <MemoryRouter initialEntries={['/invoice?section=c1%3AcatA&page=3&ipf_productIds=product-1']}>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </MemoryRouter>
  )

  it('THEN sends the current category, page, filters and fixed limit', async () => {
    renderHook(
      () =>
        useInvoiceProductFees({
          invoiceId: 'invoice-1',
          section: sections[0],
          filters: {
            productIds: ['product-1'],
            productFilterIds: ['filter-1'],
            withoutProductFilter: true,
            productType: ProductTypeEnum.Fixed,
          },
        }),
      { wrapper },
    )
    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toEqual({
      invoiceId: 'invoice-1',
      contractId: 'c1',
      productCategoryId: 'catA',
      page: 3,
      limit: 100,
      productIds: ['product-1'],
      productFilterIds: ['filter-1'],
      withoutProductFilter: true,
      productType: ProductTypeEnum.Fixed,
    })
  })

  it('THEN requests standalone products without a category id', async () => {
    renderHook(() => useInvoiceProductFees({ invoiceId: 'invoice-1', section: sections[1] }), {
      wrapper,
    })
    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toMatchObject({
      contractId: 'c1',
      standaloneProducts: true,
      page: 3,
      limit: 100,
    })
    expect(requests[0]).not.toHaveProperty('productCategoryId')
  })

  it('THEN changes section and removes page in one navigation while preserving filters', async () => {
    const { result } = renderHook(
      () => useInvoiceProductFees({ invoiceId: 'invoice-1', section: sections[0] }),
      { wrapper },
    )

    await waitFor(() => expect(requests).toHaveLength(1))
    act(() => result.current.selectSection('c2:standalone'))
    expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
    expect(testMockNavigateFn).toHaveBeenCalledWith(
      { search: 'section=c2%3Astandalone&ipf_productIds=product-1' },
      { replace: true },
    )
  })

  it('THEN resets the URL page before sending a debounced search', async () => {
    const { result } = renderHook(
      () => useInvoiceProductFees({ invoiceId: 'invoice-1', section: sections[0] }),
      { wrapper },
    )

    await waitFor(() => expect(requests).toHaveLength(1))
    act(() => result.current.onSearchChange('salad'))
    expect(testMockNavigateFn).toHaveBeenCalledWith(
      { search: 'section=c1%3AcatA&ipf_productIds=product-1' },
      { replace: true },
    )
    await waitFor(() => expect(requests.at(-1)?.searchTerm).toBe('salad'), {
      timeout: DEBOUNCE_SEARCH_MS + 1000,
    })
  })
})
