import type { MockedResponse } from '@apollo/client/testing'
import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { contractForDrawerFixture } from '~/components/contracts/drawers/contract/__tests__/fixtures'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderReader } from '~/components/MainHeader/MainHeaderContext'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { ContractDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CONTRACT_DETAILS_ROUTE,
  CONTRACT_DETAILS_SECTION_ROUTE,
  CONTRACT_DETAILS_TAB_ROUTE,
  objectDetailsRoutes,
} from '~/core/router/ObjectsRoutes'
import {
  ContractStatusEnum,
  FeatureFlagEnum,
  GetContractForDetailsDocument,
} from '~/generated/graphql'
import { TMembershipPermissions } from '~/hooks/usePermissions'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import ContractDetails, {
  CONTRACT_DETAILS_ACTIONS_TEST_ID,
  CONTRACT_DETAILS_CANCEL_TEST_ID,
  CONTRACT_DETAILS_COPY_ID_TEST_ID,
  CONTRACT_DETAILS_EDIT_TEST_ID,
  CONTRACT_DETAILS_TERMINATE_TEST_ID,
} from '../ContractDetails'

const mockCopyContractExternalId = jest.fn()
const mockOpenTerminateContractDialog = jest.fn()
const mockHasPermissions = jest.fn()
const mockCanTerminateContract = jest.fn()
const mockCanEditContract = jest.fn()
const mockOpenContractDrawer = jest.fn()
let mockIsPremium = true

jest.mock('~/components/contracts/useCopyContractExternalId', () => ({
  useCopyContractExternalId: () => ({
    copyContractExternalId: mockCopyContractExternalId,
    copyContractExternalIdLabel: 'copy-contract-id',
  }),
}))

jest.mock('~/components/contracts/useTerminateContractDialog', () => ({
  getContractTerminationCopy: jest.requireActual(
    '~/components/contracts/useTerminateContractDialog',
  ).getContractTerminationCopy,
  useTerminateContractDialog: () => ({
    openTerminateContractDialog: mockOpenTerminateContractDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useContractPermissionsActions', () => ({
  useContractPermissionsActions: () => ({
    canTerminateContract: mockCanTerminateContract,
    canEditContract: mockCanEditContract,
  }),
}))

jest.mock('~/components/contracts/drawers/contract/useContractDrawer', () => ({
  useContractDrawer: () => ({ openDrawer: mockOpenContractDrawer }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('../details/ContractDetailsOverview', () => ({
  ContractDetailsOverview: () => <div data-test="contract-overview" />,
}))

const contractFixture = {
  ...contractForDrawerFixture,
  id: 'contract-1',
  externalId: 'external-contract-1',
  name: null,
  status: ContractStatusEnum.Active,
  appliedRateCardsCount: 3,
  plan: {
    __typename: 'CatalogPlan',
    id: 'plan-1',
    name: 'Enterprise plan',
    code: 'enterprise',
  },
}

const detailsQueryMock = {
  request: { query: GetContractForDetailsDocument, variables: { id: 'contract-1' } },
  result: { data: { contract: contractFixture } },
}

const mainHeaderConfigSpy = jest.fn()

const MainHeaderConfigSpy = (): null => {
  const { config } = useMainHeaderReader()

  mainHeaderConfigSpy(config)
  return null
}

const ContractDetailsWithHeader = () => (
  <>
    <MainHeader />
    <MainHeaderConfigSpy />
    <ContractDetails />
  </>
)

const renderPage = (
  tab: ContractDetailsTabsOptionsEnum = ContractDetailsTabsOptionsEnum.overview,
  section?: string,
  mocks: MockedResponse[] = [detailsQueryMock],
) => {
  const sectionSuffix = section ? `/${section}` : ''

  window.history.pushState({}, '', `/contracts/contract-1/${tab}${sectionSuffix}`)

  return rtlRender(<ContractDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={mocks}
        useParams={section ? { id: 'contract-1', tab, section } : { id: 'contract-1', tab }}
      >
        {children}
      </AllTheProviders>
    ),
  })
}

describe('ContractDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockCanTerminateContract.mockReturnValue(true)
    mockCanEditContract.mockReturnValue(true)
    mockIsPremium = true
  })

  it('registers every protected contract details route', () => {
    const route = objectDetailsRoutes.find(
      ({ path }) => Array.isArray(path) && path.includes(CONTRACT_DETAILS_ROUTE),
    )

    expect(CONTRACT_DETAILS_ROUTE).toBe('/contracts/:id')
    expect(CONTRACT_DETAILS_TAB_ROUTE).toBe('/contracts/:id/:tab')
    expect(CONTRACT_DETAILS_SECTION_ROUTE).toBe('/contracts/:id/overview/:section')
    expect(route).toEqual(
      expect.objectContaining({
        path: [CONTRACT_DETAILS_ROUTE, CONTRACT_DETAILS_TAB_ROUTE, CONTRACT_DETAILS_SECTION_ROUTE],
        private: true,
        permissions: ['contractsView'],
        featureFlag: FeatureFlagEnum.ProductCatalog,
      }),
    )
  })

  it('uses the plan name fallback and displays the external ID', async () => {
    await act(() => renderPage())

    expect(await screen.findByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)).toHaveTextContent(
      'Enterprise plan',
    )
    expect(screen.getByTestId(ENTITY_SECTION_METADATA_TEST_ID)).toHaveTextContent(
      'external-contract-1',
    )
  })

  it('copies the external ID from the header action', async () => {
    await act(() => renderPage())

    await userEvent.click(await screen.findByTestId(CONTRACT_DETAILS_ACTIONS_TEST_ID))
    await userEvent.click(screen.getByTestId(CONTRACT_DETAILS_COPY_ID_TEST_ID))

    expect(mockCopyContractExternalId).toHaveBeenCalledWith('external-contract-1')
  })

  it('opens the shared lifecycle dialog for an active contract', async () => {
    await act(() => renderPage())

    await userEvent.click(await screen.findByTestId(CONTRACT_DETAILS_ACTIONS_TEST_ID))
    await userEvent.click(screen.getByTestId(CONTRACT_DETAILS_TERMINATE_TEST_ID))

    expect(mockOpenTerminateContractDialog).toHaveBeenCalledWith(contractFixture)
  })

  it('opens the contract drawer in edit mode from the header action', async () => {
    await act(() => renderPage())

    await userEvent.click(await screen.findByTestId(CONTRACT_DETAILS_ACTIONS_TEST_ID))
    await userEvent.click(screen.getByTestId(CONTRACT_DETAILS_EDIT_TEST_ID))

    expect(mockOpenContractDrawer).toHaveBeenCalledWith({
      contract: expect.objectContaining({ id: 'contract-1', externalId: 'external-contract-1' }),
    })
  })

  it('hides the edit action when the contract is not editable', async () => {
    mockCanEditContract.mockReturnValue(false)

    await act(() => renderPage())

    await userEvent.click(await screen.findByTestId(CONTRACT_DETAILS_ACTIONS_TEST_ID))

    expect(screen.queryByTestId(CONTRACT_DETAILS_EDIT_TEST_ID)).not.toBeInTheDocument()
    expect(mockCanEditContract).toHaveBeenCalledWith(ContractStatusEnum.Active)
  })

  it('hides the lifecycle action without contractsUpdate permission', async () => {
    mockCanTerminateContract.mockReturnValue(false)

    await act(() => renderPage())

    await userEvent.click(await screen.findByTestId(CONTRACT_DETAILS_ACTIONS_TEST_ID))

    expect(screen.queryByTestId(CONTRACT_DETAILS_TERMINATE_TEST_ID)).not.toBeInTheDocument()
    expect(screen.getByTestId(CONTRACT_DETAILS_COPY_ID_TEST_ID)).toBeInTheDocument()
  })

  it('marks the lifecycle action as destructive', async () => {
    await act(() => renderPage())

    await userEvent.click(await screen.findByTestId(CONTRACT_DETAILS_ACTIONS_TEST_ID))

    expect(screen.getByTestId(CONTRACT_DETAILS_TERMINATE_TEST_ID)).toHaveClass('button-danger')
  })

  it.each([ContractStatusEnum.Canceled, ContractStatusEnum.Terminated])(
    'hides the lifecycle action for a %s contract',
    async (status) => {
      const terminalContract = { ...contractFixture, status }
      const terminalMock = {
        request: detailsQueryMock.request,
        result: { data: { contract: terminalContract } },
      }

      await act(() =>
        renderPage(ContractDetailsTabsOptionsEnum.overview, undefined, [terminalMock]),
      )

      await userEvent.click(await screen.findByTestId(CONTRACT_DETAILS_ACTIONS_TEST_ID))

      expect(screen.queryByTestId(CONTRACT_DETAILS_TERMINATE_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(CONTRACT_DETAILS_CANCEL_TEST_ID)).not.toBeInTheDocument()
    },
  )

  it('shows usage and premium activity-log tabs', async () => {
    await act(() => renderPage())

    expect(await screen.findByText('text_1725983967306cf8dwr2r4u2')).toBeInTheDocument()
    expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
  })

  it('hides activity logs without premium and without audit-log permission', async () => {
    mockIsPremium = false
    mockHasPermissions.mockImplementation(
      (permissions: Array<keyof TMembershipPermissions>) => !permissions.includes('auditLogsView'),
    )

    await act(() => renderPage())

    expect(await screen.findByText('text_1725983967306cf8dwr2r4u2')).toBeInTheDocument()
    expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
  })

  it('matches the base overview route and nested overview sections', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(mainHeaderConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tabs: expect.arrayContaining([
            expect.objectContaining({
              title: 'text_628cf761cbe6820138b8f2e4',
              match: [
                '/contracts/contract-1',
                '/contracts/contract-1/overview',
                '/contracts/contract-1/overview/:section',
              ],
            }),
          ]),
        }),
      )
    })
  })

  it.each([
    {
      scenario: 'the API returns a not-found error',
      mock: {
        request: { query: GetContractForDetailsDocument, variables: { id: 'contract-1' } },
        result: {
          errors: [
            {
              message: 'Resource not found',
              extensions: { code: 'not_found' },
            },
          ],
        },
      },
    },
    {
      scenario: 'the API returns a null contract',
      mock: {
        request: { query: GetContractForDetailsDocument, variables: { id: 'contract-1' } },
        result: { data: { contract: null } },
      },
    },
  ])('redirects to the contracts list when $scenario', async ({ mock }) => {
    await act(() =>
      renderPage(ContractDetailsTabsOptionsEnum.overview, undefined, [mock] as MockedResponse[]),
    )

    await waitFor(() => {
      expect(testMockNavigateFn).toHaveBeenCalledWith('/contracts', { replace: true })
    })
  })
})
