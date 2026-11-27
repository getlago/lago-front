import { ApolloClient, useApolloClient } from '@apollo/client'
import { MockedResponse } from '@apollo/client/testing'
import { act, render as rtlRender, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { BREADCRUMB_NAV_TEST_ID } from '~/components/MainHeader/Breadcrumb'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'
import { addToast } from '~/core/apolloClient'
import { CONTRACT_ALERT_DETAILS_ROUTE, objectDetailsRoutes } from '~/core/router/ObjectsRoutes'
import {
  ContractAlertForDetailsFragment,
  ContractAlertTypeEnum,
  ContractForContractAlertDetailsFragment,
  ContractStatusEnum,
  CurrencyEnum,
  FeatureFlagEnum,
  GetContractAlertForDetailsDocument,
} from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import ContractAlertDetails, {
  CONTRACT_ALERT_DETAILS_ACTIONS_TEST_ID,
  CONTRACT_ALERT_DETAILS_DELETE_TEST_ID,
  CONTRACT_ALERT_DETAILS_EDIT_TEST_ID,
} from '../ContractAlertDetails'
import { CONTRACT_ALERT_OVERVIEW_TEST_ID } from '../ContractAlertDetailsOverview'

jest.setTimeout(15000)

const CONTRACT_ID = 'contract-1'
const ALERT_ID = 'alert-1'
const ALERTS_SECTION_PATH = `/contracts/${CONTRACT_ID}/overview/alerts`

const mockHasPermissions = jest.fn()
const mockOpenDrawer = jest.fn()
const mockOpenDeleteAlertDialog = jest.fn()
let mockIsPremium = true

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/components/contracts/drawers/contractAlert/useContractAlertDrawer', () => ({
  useContractAlertDrawer: () => ({ openDrawer: mockOpenDrawer }),
}))

jest.mock('~/components/alerts/DeleteAlertDialog', () => ({
  useDeleteAlertDialog: () => ({ openDeleteAlertDialog: mockOpenDeleteAlertDialog }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const buildContract = (
  overrides: Partial<ContractForContractAlertDetailsFragment> = {},
): ContractForContractAlertDetailsFragment => ({
  __typename: 'Contract',
  id: CONTRACT_ID,
  name: 'Acme contract',
  externalId: 'acme_contract',
  currency: CurrencyEnum.Eur,
  status: ContractStatusEnum.Active,
  plan: null,
  ...overrides,
})

const buildAlert = (
  overrides: Partial<ContractAlertForDetailsFragment> = {},
): ContractAlertForDetailsFragment => ({
  __typename: 'ContractAlert',
  id: ALERT_ID,
  contractExternalId: 'acme_contract',
  name: 'Usage alert',
  code: 'usage_alert',
  alertType: ContractAlertTypeEnum.UsageUnits,
  scope: [],
  thresholds: [],
  ...overrides,
})

const request = {
  query: GetContractAlertForDetailsDocument,
  variables: { alertId: ALERT_ID, contractId: CONTRACT_ID },
}

const detailsQueryMock = (
  alert: ContractAlertForDetailsFragment | null,
  contract: ContractForContractAlertDetailsFragment | null,
  onRequest?: jest.Mock,
): MockedResponse => ({
  request,
  result: () => {
    onRequest?.()

    return { data: { contractAlert: alert, contract } }
  },
})

const notFoundQueryMock = (
  contract: ContractForContractAlertDetailsFragment | null,
): MockedResponse => ({
  request,
  result: {
    data: { contractAlert: null, contract },
    errors: [{ message: 'Resource not found', extensions: { code: 'not_found' } }],
  },
})

let apolloClient: ApolloClient<object> | undefined

const ClientCapture = (): null => {
  apolloClient = useApolloClient() as ApolloClient<object>

  return null
}

const renderPage = async (mocks: MockedResponse[]): Promise<{ container: HTMLElement }> => {
  let container: HTMLElement = document.body

  await act(async () => {
    const result = rtlRender(<ContractAlertDetails />, {
      wrapper: ({ children }) => (
        <AllTheProviders
          forceTypenames
          mocks={mocks}
          useParams={{ id: CONTRACT_ID, alertId: ALERT_ID }}
        >
          <ClientCapture />
          <MainHeader />
          <div data-test="page-host">{children}</div>
        </AllTheProviders>
      ),
    })

    container = result.container
  })

  return { container }
}

const getPageHost = (): HTMLElement => screen.getByTestId('page-host')

const openActions = async (): Promise<void> => {
  await userEvent.click((await screen.findAllByTestId(CONTRACT_ALERT_DETAILS_ACTIONS_TEST_ID))[0])
}

describe('CONTRACT_ALERT_DETAILS_ROUTE', () => {
  it('THEN should be a flag-gated details route readable with contractsView', () => {
    expect(CONTRACT_ALERT_DETAILS_ROUTE).toBe('/contracts/:id/alerts/:alertId')
    expect(objectDetailsRoutes).toContainEqual(
      expect.objectContaining({
        path: [CONTRACT_ALERT_DETAILS_ROUTE],
        permissions: ['contractsView'],
        featureFlag: FeatureFlagEnum.ContractAlerts,
      }),
    )
  })
})

describe('ContractAlertDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremium = true
    mockHasPermissions.mockReturnValue(true)
    apolloClient = undefined
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN an alert of the route contract', () => {
    it('THEN should render the overview with the contract crumb linking to its alerts', async () => {
      await renderPage([detailsQueryMock(buildAlert(), buildContract())])

      await waitFor(() =>
        expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
          'Usage alert',
        ),
      )

      const parentCrumb = within(screen.getAllByTestId(BREADCRUMB_NAV_TEST_ID)[0]).getAllByRole(
        'link',
      )[1]

      expect(parentCrumb).toHaveTextContent('Acme contract')
      expect(parentCrumb).toHaveAttribute('href', ALERTS_SECTION_PATH)
      expect(screen.getByTestId(CONTRACT_ALERT_OVERVIEW_TEST_ID)).toBeInTheDocument()
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the contract status', () => {
    it.each([
      [ContractStatusEnum.Terminated, false],
      [ContractStatusEnum.Canceled, false],
      [ContractStatusEnum.Active, true],
    ])('WHEN it is %s THEN should show edit: %s, and always delete', async (status, hasEdit) => {
      await renderPage([detailsQueryMock(buildAlert(), buildContract({ status }))])
      await openActions()

      expect(!!screen.queryByTestId(CONTRACT_ALERT_DETAILS_EDIT_TEST_ID)).toBe(hasEdit)
      expect(screen.getByTestId(CONTRACT_ALERT_DETAILS_DELETE_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN the user cannot update the alert', () => {
    it.each([
      ['is not premium', false, true],
      ['lacks contractsUpdate', true, false],
    ])('WHEN the user %s THEN should hide every action', async (_, isPremium, canUpdate) => {
      mockIsPremium = isPremium
      mockHasPermissions.mockReturnValue(canUpdate)

      await renderPage([detailsQueryMock(buildAlert(), buildContract())])
      await waitFor(() => expect(screen.getByTestId(CONTRACT_ALERT_OVERVIEW_TEST_ID)).toBeVisible())

      expect(screen.queryByTestId(CONTRACT_ALERT_DETAILS_ACTIONS_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the alert does not exist', () => {
    it('THEN should redirect once to the contract alerts section with an info toast', async () => {
      await renderPage([notFoundQueryMock(buildContract())])

      await waitFor(() =>
        expect(testMockNavigateFn).toHaveBeenCalledWith(ALERTS_SECTION_PATH, { replace: true }),
      )
      expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
    })
  })

  describe('GIVEN the contract does not exist', () => {
    it('THEN should redirect once to the contracts list', async () => {
      await renderPage([notFoundQueryMock(null)])

      await waitFor(() =>
        expect(testMockNavigateFn).toHaveBeenCalledWith('/contracts', { replace: true }),
      )
      expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN the alert belongs to another contract than the URL', () => {
    it('THEN should redirect to the URL contract alerts and render nothing', async () => {
      await renderPage([
        detailsQueryMock(buildAlert({ contractExternalId: 'other_contract' }), buildContract()),
      ])

      await waitFor(() =>
        expect(testMockNavigateFn).toHaveBeenCalledWith(ALERTS_SECTION_PATH, { replace: true }),
      )
      expect(getPageHost().firstChild).toBeNull()
    })
  })

  describe('GIVEN the query is still loading', () => {
    it('THEN should neither navigate nor render the overview or the error placeholder', async () => {
      await renderPage([{ ...detailsQueryMock(buildAlert(), buildContract()), delay: Infinity }])

      expect(testMockNavigateFn).not.toHaveBeenCalled()
      expect(screen.queryByTestId(CONTRACT_ALERT_OVERVIEW_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the query fails with another error', () => {
    it('THEN should render the error placeholder without redirecting', async () => {
      await renderPage([{ request, error: new Error('Network error') }])

      expect(await screen.findByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the delete action', () => {
    it('THEN should navigate back to the alerts section once deleted', async () => {
      await renderPage([detailsQueryMock(buildAlert(), buildContract())])
      await openActions()
      await userEvent.click(screen.getByTestId(CONTRACT_ALERT_DETAILS_DELETE_TEST_ID))

      expect(mockOpenDeleteAlertDialog).toHaveBeenCalledWith(
        expect.objectContaining({ alertKind: 'contract', id: ALERT_ID }),
      )

      act(() => mockOpenDeleteAlertDialog.mock.calls[0][0].onDeleted())

      expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
      expect(testMockNavigateFn).toHaveBeenCalledWith(ALERTS_SECTION_PATH)
    })
  })

  describe('GIVEN the edit action', () => {
    it('THEN should open the drawer with the alert and refresh from the cache after a save', async () => {
      const onRequest = jest.fn()
      const alert = buildAlert()

      await renderPage([detailsQueryMock(alert, buildContract(), onRequest)])
      await openActions()
      await userEvent.click(screen.getByTestId(CONTRACT_ALERT_DETAILS_EDIT_TEST_ID))

      expect(mockOpenDrawer).toHaveBeenCalledWith({
        contractId: CONTRACT_ID,
        currency: CurrencyEnum.Eur,
        alert: expect.objectContaining({ id: ALERT_ID, code: 'usage_alert' }),
      })

      act(() => {
        apolloClient?.cache.modify({
          id: apolloClient.cache.identify({ __typename: 'ContractAlert', id: ALERT_ID }),
          fields: { name: () => 'Renamed' },
        })
      })

      await waitFor(() =>
        expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
          'Renamed',
        ),
      )
      expect(onRequest).toHaveBeenCalledTimes(1)
    })
  })
})
