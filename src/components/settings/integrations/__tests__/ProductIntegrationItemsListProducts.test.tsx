import { createRef } from 'react'

import {
  GetProductsForAnrokItemsListQuery,
  IntegrationTypeEnum,
  MappableTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import AnrokIntegrationItemsListProducts from '../AnrokIntegrationItemsListProducts'
import AvalaraIntegrationItemsListProducts from '../AvalaraIntegrationItemsListProducts'

const mockFetchableIntegrationItemList = jest.fn<null, [unknown]>(() => null)
const mockFetchMore = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/pages/settings/integrations/FetchableIntegrationItemList', () => ({
  __esModule: true,
  default: function FetchableIntegrationItemList(props: unknown) {
    return mockFetchableIntegrationItemList(props)
  },
}))

const productsData: GetProductsForAnrokItemsListQuery = {
  products: {
    collection: [
      {
        code: 'compute',
        id: 'product-id',
        integrationMappings: [
          {
            billingEntityId: 'billing-entity-id',
            externalAccountCode: null,
            externalId: 'external-product-id',
            externalName: 'External product',
            id: 'mapping-id',
            mappableType: MappableTypeEnum.Product,
          },
        ],
        name: 'Compute',
      },
    ],
    metadata: {
      currentPage: 1,
      totalCount: 1,
      totalPages: 1,
    },
  },
}

describe.each([
  {
    provider: IntegrationTypeEnum.Anrok,
    renderList: () => (
      <AnrokIntegrationItemsListProducts
        anrokIntegrationMapItemDrawerRef={createRef()}
        data={productsData}
        fetchMoreProducts={mockFetchMore}
        hasError={false}
        integrationId="integration-id"
        isLoading={false}
        searchTerm={undefined}
      />
    ),
  },
  {
    provider: IntegrationTypeEnum.Avalara,
    renderList: () => (
      <AvalaraIntegrationItemsListProducts
        avalaraIntegrationMapItemDrawerRef={createRef()}
        data={productsData}
        fetchMoreProducts={mockFetchMore}
        hasError={false}
        integrationId="integration-id"
        isLoading={false}
        searchTerm={undefined}
      />
    ),
  },
])('$provider Product list', ({ provider, renderList }) => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes Product data and mappings to the shared integration list', () => {
    render(renderList())

    expect(mockFetchableIntegrationItemList).toHaveBeenCalledWith(
      expect.objectContaining({
        createRoute: '/product-catalog/products',
        data: productsData.products,
        fetchMore: mockFetchMore,
        firstColumnName: 'text_1783980718114nwd34e3ji77',
        integrationId: 'integration-id',
        mappableType: MappableTypeEnum.Product,
        provider,
      }),
    )
  })
})
