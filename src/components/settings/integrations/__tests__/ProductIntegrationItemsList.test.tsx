import { waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentType } from 'react'

import { FeatureFlagEnum, MappableTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import AnrokIntegrationItemsList from '../AnrokIntegrationItemsList'
import AvalaraIntegrationItemsList from '../AvalaraIntegrationItemsList'

const mockHasFeatureFlag = jest.fn()
const mockHasPermissions = jest.fn()
const mockGetAnrokAddOns = jest.fn()
const mockGetAnrokBillableMetrics = jest.fn()
const mockGetAnrokDefaultItems = jest.fn()
const mockGetAnrokProducts = jest.fn()
const mockGetAvalaraAddOns = jest.fn()
const mockGetAvalaraBillableMetrics = jest.fn()
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
  useGetAddOnsForAnrokItemsListLazyQuery: () => [mockGetAnrokAddOns, mockLazyQueryResult],
  useGetBillableMetricsForAnrokItemsListLazyQuery: () => [
    mockGetAnrokBillableMetrics,
    mockLazyQueryResult,
  ],
  useGetProductsForAnrokItemsListLazyQuery: () => [mockGetAnrokProducts, mockLazyQueryResult],
  useGetAvalaraIntegrationCollectionMappingsLazyQuery: () => [
    mockGetAvalaraDefaultItems,
    mockLazyQueryResult,
  ],
  useGetAddOnsForAvalaraItemsListLazyQuery: () => [mockGetAvalaraAddOns, mockLazyQueryResult],
  useGetBillableMetricsForAvalaraItemsListLazyQuery: () => [
    mockGetAvalaraBillableMetrics,
    mockLazyQueryResult,
  ],
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
  getAddOns: jest.Mock
  getBillableMetrics: jest.Mock
  getDefaultItems: jest.Mock
  getProducts: jest.Mock
  productItemsTestId: string
}

const providerTestCases: ProviderTestCase[] = [
  {
    component: AnrokIntegrationItemsList,
    defaultItemsTestId: 'anrok-default-items',
    getAddOns: mockGetAnrokAddOns,
    getBillableMetrics: mockGetAnrokBillableMetrics,
    getDefaultItems: mockGetAnrokDefaultItems,
    getProducts: mockGetAnrokProducts,
    productItemsTestId: 'anrok-product-items',
  },
  {
    component: AvalaraIntegrationItemsList,
    defaultItemsTestId: 'avalara-default-items',
    getAddOns: mockGetAvalaraAddOns,
    getBillableMetrics: mockGetAvalaraBillableMetrics,
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
    getAddOns,
    getBillableMetrics,
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

    it('only offers Default and Product mapping types', async () => {
      window.history.replaceState({}, '', '/?item_type=Default')

      const { getByRole, getByText, queryByText } = render(
        <IntegrationItemsList integrationId="integration-id" />,
      )

      await userEvent.click(getByRole('button', { name: 'text_65281f686a80b400c8e2f6d1' }))

      expect(getByText('text_17831042398250iwa2xp8pba')).toBeInTheDocument()
      expect(queryByText('text_629728388c4d2300e2d3801a')).not.toBeInTheDocument()
      expect(queryByText('text_623b497ad05b960101be3438')).not.toBeInTheDocument()
    })

    it('offers legacy mapping types without Product Catalog', async () => {
      mockHasFeatureFlag.mockReturnValue(false)
      window.history.replaceState({}, '', '/?item_type=Default')

      const { getByRole, getByText, queryByText } = render(
        <IntegrationItemsList integrationId="integration-id" />,
      )

      await userEvent.click(getByRole('button', { name: 'text_65281f686a80b400c8e2f6d1' }))

      expect(getByText('text_629728388c4d2300e2d3801a')).toBeInTheDocument()
      expect(getByText('text_623b497ad05b960101be3438')).toBeInTheDocument()
      expect(queryByText('text_17831042398250iwa2xp8pba')).not.toBeInTheDocument()
    })

    it.each([MappableTypeEnum.AddOn, MappableTypeEnum.BillableMetric])(
      'keeps the legacy %s mapping type without Product Catalog',
      async (legacyItemType) => {
        mockHasFeatureFlag.mockReturnValue(false)
        window.history.replaceState({}, '', `/?item_type=${legacyItemType}`)

        render(<IntegrationItemsList integrationId="integration-id" />)

        const getLegacyItems =
          legacyItemType === MappableTypeEnum.AddOn ? getAddOns : getBillableMetrics

        await waitFor(() => expect(getLegacyItems).toHaveBeenCalled())

        expect(getDefaultItems).not.toHaveBeenCalled()
        expect(getProducts).not.toHaveBeenCalled()
        expect(window.location.search).toBe(`?item_type=${legacyItemType}`)
      },
    )

    it.each([MappableTypeEnum.AddOn, MappableTypeEnum.BillableMetric])(
      'falls back to Default for the removed %s mapping type',
      async (removedItemType) => {
        window.history.replaceState({}, '', `/?item_type=${removedItemType}`)

        const { getByTestId, queryByTestId } = render(
          <IntegrationItemsList integrationId="integration-id" />,
        )

        await waitFor(() => expect(getDefaultItems).toHaveBeenCalled())

        expect(getByTestId(defaultItemsTestId)).toBeInTheDocument()
        expect(queryByTestId(productItemsTestId)).not.toBeInTheDocument()
        expect(getProducts).not.toHaveBeenCalled()
        expect(window.location.search).toBe('?item_type=Default')
      },
    )
  },
)
