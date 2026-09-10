import { screen } from '@testing-library/react'
import { ComponentType } from 'react'

import { render } from '~/test-utils'

import AnrokIntegrationItemsList from '../AnrokIntegrationItemsList'
import AvalaraIntegrationItemsList from '../AvalaraIntegrationItemsList'
import NetsuiteIntegrationItemsList from '../NetsuiteIntegrationItemsList'
import XeroIntegrationItemsList from '../XeroIntegrationItemsList'

const ANROK_DEFAULT_LIST_TEST_ID = 'anrok-default-list'
const AVALARA_DEFAULT_LIST_TEST_ID = 'avalara-default-list'
const NETSUITE_DEFAULT_LIST_TEST_ID = 'netsuite-default-list'
const XERO_DEFAULT_LIST_TEST_ID = 'xero-default-list'

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
  default: ({ isLoading }: { isLoading: boolean }) => (
    <div data-test="anrok-default-list" data-loading={String(isLoading)} />
  ),
}))
jest.mock('~/components/settings/integrations/AvalaraIntegrationItemsListDefault', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) => (
    <div data-test="avalara-default-list" data-loading={String(isLoading)} />
  ),
}))
jest.mock('~/components/settings/integrations/NetsuiteIntegrationItemsListDefault', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) => (
    <div data-test="netsuite-default-list" data-loading={String(isLoading)} />
  ),
}))
jest.mock('~/components/settings/integrations/XeroIntegrationItemsListDefault', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) => (
    <div data-test="xero-default-list" data-loading={String(isLoading)} />
  ),
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
  defaultListTestId: string
}

const PROVIDER_CASES: ProviderCase[] = [
  {
    provider: 'Anrok',
    Component: AnrokIntegrationItemsList,
    key: 'anrok',
    defaultListTestId: ANROK_DEFAULT_LIST_TEST_ID,
  },
  {
    provider: 'Avalara',
    Component: AvalaraIntegrationItemsList,
    key: 'avalara',
    defaultListTestId: AVALARA_DEFAULT_LIST_TEST_ID,
  },
  {
    provider: 'Netsuite',
    Component: NetsuiteIntegrationItemsList,
    key: 'netsuite',
    defaultListTestId: NETSUITE_DEFAULT_LIST_TEST_ID,
  },
  {
    provider: 'Xero',
    Component: XeroIntegrationItemsList,
    key: 'xero',
    defaultListTestId: XERO_DEFAULT_LIST_TEST_ID,
  },
]

describe('IntegrationItemsList fetch guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the parent details query has not resolved yet', () => {
    describe('WHEN the items list mounts without an integration id', () => {
      it.each(PROVIDER_CASES)(
        'THEN should not execute any $provider items query',
        ({ Component, key }) => {
          render(<Component integrationId="" />)

          expect(mockExecs[key].getDefaultItems).not.toHaveBeenCalled()
          expect(mockExecs[key].getAddonList).not.toHaveBeenCalled()
          expect(mockExecs[key].getBillableMetricsList).not.toHaveBeenCalled()
        },
      )

      it.each(PROVIDER_CASES)(
        'THEN should keep the $provider list in its loading state',
        ({ Component, defaultListTestId }) => {
          render(<Component integrationId="" />)

          expect(screen.getByTestId(defaultListTestId)).toHaveAttribute('data-loading', 'true')
        },
      )
    })
  })

  describe('GIVEN the integration id is known', () => {
    describe('WHEN the items list mounts', () => {
      it.each(PROVIDER_CASES)(
        'THEN should execute the $provider default items query once',
        ({ Component, key }) => {
          render(<Component integrationId="integration-1" />)

          expect(mockExecs[key].getDefaultItems).toHaveBeenCalledTimes(1)
        },
      )

      it.each(PROVIDER_CASES)(
        'THEN should leave the $provider list out of its loading state',
        ({ Component, defaultListTestId }) => {
          render(<Component integrationId="integration-1" />)

          expect(screen.getByTestId(defaultListTestId)).toHaveAttribute('data-loading', 'false')
        },
      )
    })
  })

  describe('GIVEN the items list mounted without an integration id', () => {
    describe('WHEN the parent details query resolves and passes the real id', () => {
      it.each(PROVIDER_CASES)(
        'THEN should execute the $provider default items query exactly once',
        ({ Component, key }) => {
          const { rerender } = render(<Component integrationId="" />)

          expect(mockExecs[key].getDefaultItems).not.toHaveBeenCalled()

          rerender(<Component integrationId="integration-1" />)

          expect(mockExecs[key].getDefaultItems).toHaveBeenCalledTimes(1)
        },
      )
    })
  })

  describe('GIVEN the searchable lists are gated until the integration id is known', () => {
    describe('WHEN the parent details query resolves and passes the real id', () => {
      it.each(PROVIDER_CASES)(
        'THEN should run the deferred $provider add-on and billable metric queries once',
        ({ Component, key }) => {
          const { rerender } = render(<Component integrationId="" />)

          rerender(<Component integrationId="integration-1" />)

          expect(mockExecs[key].getAddonList).toHaveBeenCalledTimes(1)
          expect(mockExecs[key].getBillableMetricsList).toHaveBeenCalledTimes(1)
        },
      )
    })
  })
})
