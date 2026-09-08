import { waitFor } from '@testing-library/react'
import { ComponentType } from 'react'

import { FeatureFlagEnum, MappableTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import AnrokIntegrationItemsList from '../AnrokIntegrationItemsList'
import AvalaraIntegrationItemsList from '../AvalaraIntegrationItemsList'

const mockHasFeatureFlag = jest.fn()
const mockHasPermissions = jest.fn()
const mockGetAnrokDefaultItems = jest.fn()
const mockGetAnrokProducts = jest.fn()
const mockGetAvalaraDefaultItems = jest.fn()
const mockGetAvalaraProducts = jest.fn()
let mockIsOrganizationLoading = false

const mockLazyQueryResult = {
  data: undefined,
  error: undefined,
  fetchMore: jest.fn(),
  loading: false,
  variables: undefined,
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: jest.fn(),
    isLoading: false,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasFeatureFlag: mockHasFeatureFlag,
    loading: mockIsOrganizationLoading,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetAnrokIntegrationCollectionMappingsLazyQuery: () => [
    mockGetAnrokDefaultItems,
    mockLazyQueryResult,
  ],
  useGetAddOnsForAnrokItemsListLazyQuery: () => [jest.fn(), mockLazyQueryResult],
  useGetBillableMetricsForAnrokItemsListLazyQuery: () => [jest.fn(), mockLazyQueryResult],
  useGetProductsForAnrokItemsListLazyQuery: () => [mockGetAnrokProducts, mockLazyQueryResult],
  useGetAvalaraIntegrationCollectionMappingsLazyQuery: () => [
    mockGetAvalaraDefaultItems,
    mockLazyQueryResult,
  ],
  useGetAddOnsForAvalaraItemsListLazyQuery: () => [jest.fn(), mockLazyQueryResult],
  useGetBillableMetricsForAvalaraItemsListLazyQuery: () => [jest.fn(), mockLazyQueryResult],
  useGetProductsForAvalaraItemsListLazyQuery: () => [mockGetAvalaraProducts, mockLazyQueryResult],
}))

jest.mock(
  '../AnrokIntegrationItemsListDefault',
  () =>
    function AnrokIntegrationItemsListDefault() {
      return <div data-test="anrok-default-items" />
    },
)
jest.mock(
  '../AnrokIntegrationItemsListAddons',
  () =>
    function AnrokIntegrationItemsListAddons() {
      return null
    },
)
jest.mock(
  '../AnrokIntegrationItemsListBillableMetrics',
  () =>
    function AnrokIntegrationItemsListBillableMetrics() {
      return null
    },
)
jest.mock(
  '../AnrokIntegrationItemsListProducts',
  () =>
    function AnrokIntegrationItemsListProducts() {
      return <div data-test="anrok-product-items" />
    },
)
jest.mock(
  '../AvalaraIntegrationItemsListDefault',
  () =>
    function AvalaraIntegrationItemsListDefault() {
      return <div data-test="avalara-default-items" />
    },
)
jest.mock(
  '../AvalaraIntegrationItemsListAddons',
  () =>
    function AvalaraIntegrationItemsListAddons() {
      return null
    },
)
jest.mock(
  '../AvalaraIntegrationItemsListBillableMetrics',
  () =>
    function AvalaraIntegrationItemsListBillableMetrics() {
      return null
    },
)
jest.mock(
  '../AvalaraIntegrationItemsListProducts',
  () =>
    function AvalaraIntegrationItemsListProducts() {
      return <div data-test="avalara-product-items" />
    },
)

jest.mock('~/pages/settings/integrations/AnrokIntegrationMapItemDrawer', () => ({
  AnrokIntegrationMapItemDrawer: () => null,
}))
jest.mock('~/pages/settings/integrations/AvalaraIntegrationMapItemDrawer', () => ({
  AvalaraIntegrationMapItemDrawer: () => null,
}))

type ProviderTestCase = {
  component: ComponentType<{ integrationId: string }>
  defaultItemsTestId: string
  getDefaultItems: jest.Mock
  getProducts: jest.Mock
  productItemsTestId: string
}

const providerTestCases: ProviderTestCase[] = [
  {
    component: AnrokIntegrationItemsList,
    defaultItemsTestId: 'anrok-default-items',
    getDefaultItems: mockGetAnrokDefaultItems,
    getProducts: mockGetAnrokProducts,
    productItemsTestId: 'anrok-product-items',
  },
  {
    component: AvalaraIntegrationItemsList,
    defaultItemsTestId: 'avalara-default-items',
    getDefaultItems: mockGetAvalaraDefaultItems,
    getProducts: mockGetAvalaraProducts,
    productItemsTestId: 'avalara-product-items',
  },
]

describe.each(providerTestCases)(
  '$productItemsTestId',
  ({
    component: IntegrationItemsList,
    defaultItemsTestId,
    getDefaultItems,
    getProducts,
    productItemsTestId,
  }) => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockHasFeatureFlag.mockReturnValue(true)
      mockHasPermissions.mockReturnValue(true)
      mockIsOrganizationLoading = false
      window.history.replaceState({}, '', `/?item_type=${MappableTypeEnum.Product}`)
    })

    it('loads products when the Product item type is selected', async () => {
      const { getByTestId, queryByTestId } = render(
        <IntegrationItemsList integrationId="integration-id" />,
      )

      await waitFor(() => expect(getProducts).toHaveBeenCalled())

      expect(getByTestId(productItemsTestId)).toBeInTheDocument()
      expect(queryByTestId(defaultItemsTestId)).not.toBeInTheDocument()
      expect(getDefaultItems).not.toHaveBeenCalled()
      expect(mockHasFeatureFlag).toHaveBeenCalledWith(FeatureFlagEnum.ProductCatalog)
      expect(mockHasPermissions).toHaveBeenCalledWith(['productsView'])
    })

    it('falls back to default items without Product access', async () => {
      mockHasPermissions.mockReturnValue(false)

      const { getByTestId, queryByTestId } = render(
        <IntegrationItemsList integrationId="integration-id" />,
      )

      await waitFor(() => expect(getDefaultItems).toHaveBeenCalled())

      expect(getByTestId(defaultItemsTestId)).toBeInTheDocument()
      expect(queryByTestId(productItemsTestId)).not.toBeInTheDocument()
      expect(getProducts).not.toHaveBeenCalled()
    })

    it('keeps the Product selection while organization data is loading', async () => {
      mockIsOrganizationLoading = true
      mockHasFeatureFlag.mockReturnValue(false)

      const { rerender } = render(<IntegrationItemsList integrationId="integration-id" />)

      expect(getDefaultItems).not.toHaveBeenCalled()
      expect(window.location.search).toBe(`?item_type=${MappableTypeEnum.Product}`)

      mockIsOrganizationLoading = false
      mockHasFeatureFlag.mockReturnValue(true)
      rerender(<IntegrationItemsList integrationId="integration-id" />)

      await waitFor(() => expect(getProducts).toHaveBeenCalled())

      expect(getDefaultItems).not.toHaveBeenCalled()
      expect(window.location.search).toBe(`?item_type=${MappableTypeEnum.Product}`)
    })
  },
)
