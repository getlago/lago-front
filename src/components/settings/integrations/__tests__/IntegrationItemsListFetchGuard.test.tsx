import { ComponentType } from 'react'

import { render } from '~/test-utils'

import AnrokIntegrationItemsList from '../AnrokIntegrationItemsList'
import AvalaraIntegrationItemsList from '../AvalaraIntegrationItemsList'
import NetsuiteIntegrationItemsList from '../NetsuiteIntegrationItemsList'
import XeroIntegrationItemsList from '../XeroIntegrationItemsList'

type ProviderExecs = {
  getDefaultItems: jest.Mock
  getAddonList: jest.Mock
  getBillableMetricsList: jest.Mock
}

const createExecs = (): ProviderExecs => ({
  getDefaultItems: jest.fn(),
  getAddonList: jest.fn(),
  getBillableMetricsList: jest.fn(),
})

const mockExecs: Record<'anrok' | 'avalara' | 'netsuite' | 'xero', ProviderExecs> = {
  anrok: createExecs(),
  avalara: createExecs(),
  netsuite: createExecs(),
  xero: createExecs(),
}

const mockQueryResult = {
  data: undefined,
  loading: false,
  error: undefined,
  fetchMore: jest.fn(),
  variables: {},
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetAnrokIntegrationCollectionMappingsLazyQuery: jest.fn(() => [
    mockExecs.anrok.getDefaultItems,
    mockQueryResult,
  ]),
  useGetAddOnsForAnrokItemsListLazyQuery: jest.fn(() => [
    mockExecs.anrok.getAddonList,
    mockQueryResult,
  ]),
  useGetBillableMetricsForAnrokItemsListLazyQuery: jest.fn(() => [
    mockExecs.anrok.getBillableMetricsList,
    mockQueryResult,
  ]),
  useGetAvalaraIntegrationCollectionMappingsLazyQuery: jest.fn(() => [
    mockExecs.avalara.getDefaultItems,
    mockQueryResult,
  ]),
  useGetAddOnsForAvalaraItemsListLazyQuery: jest.fn(() => [
    mockExecs.avalara.getAddonList,
    mockQueryResult,
  ]),
  useGetBillableMetricsForAvalaraItemsListLazyQuery: jest.fn(() => [
    mockExecs.avalara.getBillableMetricsList,
    mockQueryResult,
  ]),
  useGetNetsuiteIntegrationCollectionMappingsLazyQuery: jest.fn(() => [
    mockExecs.netsuite.getDefaultItems,
    mockQueryResult,
  ]),
  useGetAddOnsForNetsuiteItemsListLazyQuery: jest.fn(() => [
    mockExecs.netsuite.getAddonList,
    mockQueryResult,
  ]),
  useGetBillableMetricsForNetsuiteItemsListLazyQuery: jest.fn(() => [
    mockExecs.netsuite.getBillableMetricsList,
    mockQueryResult,
  ]),
  useGetXeroIntegrationCollectionMappingsLazyQuery: jest.fn(() => [
    mockExecs.xero.getDefaultItems,
    mockQueryResult,
  ]),
  useGetAddOnsForXeroItemsListLazyQuery: jest.fn(() => [
    mockExecs.xero.getAddonList,
    mockQueryResult,
  ]),
  useGetBillableMetricsForXeroItemsListLazyQuery: jest.fn(() => [
    mockExecs.xero.getBillableMetricsList,
    mockQueryResult,
  ]),
}))

jest.mock('~/components/settings/integrations/AnrokIntegrationItemsListDefault', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('~/components/settings/integrations/AvalaraIntegrationItemsListDefault', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('~/components/settings/integrations/NetsuiteIntegrationItemsListDefault', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('~/components/settings/integrations/XeroIntegrationItemsListDefault', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('~/pages/settings/integrations/AnrokIntegrationMapItemDrawer', () => ({
  AnrokIntegrationMapItemDrawer: () => null,
}))
jest.mock('~/pages/settings/integrations/AvalaraIntegrationMapItemDrawer', () => ({
  AvalaraIntegrationMapItemDrawer: () => null,
}))
jest.mock('~/pages/settings/integrations/NetsuiteIntegrationMapItemDrawer', () => ({
  NetsuiteIntegrationMapItemDrawer: () => null,
}))
jest.mock('~/pages/settings/integrations/XeroIntegrationMapItemDrawer', () => ({
  XeroIntegrationMapItemDrawer: () => null,
}))

type ProviderCase = {
  provider: string
  Component: ComponentType<{ integrationId: string }>
  key: keyof typeof mockExecs
}

const PROVIDER_CASES: ProviderCase[] = [
  { provider: 'Anrok', Component: AnrokIntegrationItemsList, key: 'anrok' },
  { provider: 'Avalara', Component: AvalaraIntegrationItemsList, key: 'avalara' },
  { provider: 'Netsuite', Component: NetsuiteIntegrationItemsList, key: 'netsuite' },
  { provider: 'Xero', Component: XeroIntegrationItemsList, key: 'xero' },
]

describe('IntegrationItemsList fetch guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the integration id is not known', () => {
    describe('WHEN the items list mounts', () => {
      it.each(PROVIDER_CASES)(
        'THEN should not query the $provider items of an empty integration id',
        ({ Component, key }) => {
          render(<Component integrationId="" />)

          expect(mockExecs[key].getDefaultItems).not.toHaveBeenCalled()
        },
      )
    })
  })

  describe('GIVEN the integration id is known', () => {
    describe('WHEN the items list mounts', () => {
      it.each(PROVIDER_CASES)(
        'THEN should query the $provider items once',
        ({ Component, key }) => {
          render(<Component integrationId="integration-1" />)

          expect(mockExecs[key].getDefaultItems).toHaveBeenCalledTimes(1)
        },
      )
    })
  })

  describe('GIVEN the items list mounted without an integration id', () => {
    describe('WHEN the id arrives on a later render', () => {
      it.each(PROVIDER_CASES)(
        'THEN should query the $provider items exactly once',
        ({ Component, key }) => {
          const { rerender } = render(<Component integrationId="" />)

          expect(mockExecs[key].getDefaultItems).not.toHaveBeenCalled()

          rerender(<Component integrationId="integration-1" />)

          expect(mockExecs[key].getDefaultItems).toHaveBeenCalledTimes(1)
        },
      )
    })
  })
})
