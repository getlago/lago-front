import { MappingTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import QuickbooksIntegrationItemsList from '../QuickbooksIntegrationItemsList'

const mockGetDefaultItems = jest.fn()
const mockGetAddonList = jest.fn()
const mockGetBillableMetricsList = jest.fn()

const mockCollectionMappings = {
  data: {
    integrationCollectionMappings: {
      collection: [
        {
          __typename: 'CollectionMapping',
          id: 'mapping-1',
          mappingType: MappingTypeEnum.FallbackItem,
          externalId: '38',
          externalName: 'Analytics',
          externalAccountCode: null,
          billingEntityId: null,
        },
      ],
    },
  },
  loading: false,
  error: undefined,
}

const mockEmptyList = {
  data: undefined,
  loading: false,
  error: undefined,
  fetchMore: jest.fn(),
  variables: {},
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetQuickbooksIntegrationCollectionMappingsLazyQuery: () => [
    mockGetDefaultItems,
    mockCollectionMappings,
  ],
  useGetAddOnsForQuickbooksItemsListLazyQuery: () => [mockGetAddonList, mockEmptyList],
  useGetBillableMetricsForQuickbooksItemsListLazyQuery: () => [
    mockGetBillableMetricsList,
    mockEmptyList,
  ],
}))

const mockDefaultListProps = jest.fn()

jest.mock('~/components/settings/integrations/QuickbooksIntegrationItemsListDefault', () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockDefaultListProps(props)

    return null
  },
}))

jest.mock('~/pages/settings/integrations/QuickbooksIntegrationMapItemDrawer', () => ({
  useQuickbooksIntegrationMapItemDrawer: () => ({ openDrawer: jest.fn() }),
}))

const renderAt = (itemType: string) => {
  window.history.pushState({}, '', `/?item_type=${itemType}`)

  return render(<QuickbooksIntegrationItemsList integrationId="integration-1" />)
}

describe('QuickbooksIntegrationItemsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN the default items', () => {
    it('THEN queries the collection mappings and hands them to the default list', () => {
      renderAt('Default')

      expect(mockGetDefaultItems).toHaveBeenCalled()
      expect(mockDefaultListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          integrationId: 'integration-1',
          defaultItems: mockCollectionMappings.data.integrationCollectionMappings.collection,
          isLoading: false,
          hasError: false,
        }),
      )
    })
  })

  describe('GIVEN the add-ons', () => {
    it('THEN queries the add-ons list only', () => {
      renderAt('AddOn')

      expect(mockGetAddonList).toHaveBeenCalled()
      expect(mockGetDefaultItems).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the billable metrics', () => {
    it('THEN queries the billable metrics list only', () => {
      renderAt('BillableMetric')

      expect(mockGetBillableMetricsList).toHaveBeenCalled()
      expect(mockGetDefaultItems).not.toHaveBeenCalled()
    })
  })
})
