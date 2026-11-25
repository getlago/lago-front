import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DIALOG_BODY_TEST_ID, DIALOG_TITLE_TEST_ID } from '~/components/dialogs/const'
import { OrganizationActivationStatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID,
  PENDING_ORGANIZATION_CANCEL_BUTTON_TEST_ID,
  PENDING_ORGANIZATION_DIALOG_TEST_ID,
  PENDING_ORGANIZATION_NAME_TEST_ID,
  PENDING_ORGANIZATION_SHELL_TEST_ID,
  PendingOrganizationShell,
  PRODUCTION_ACTIVATION_LOADER_TEST_ID,
} from '../PendingOrganizationShell'

const mockNavigate = jest.fn()
const mockUseCurrentUser = jest.fn()
const mockGetCounterpartPath = jest.fn()
const mockRefetchCurrentUserInfos = jest.fn()
const mockLocationState = jest.fn()
const mockStartBillingAccount = jest.fn()
const mockAddToast = jest.fn()

jest.mock('~/core/router', () => ({
  HOME_ROUTE: '/',
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    strippedPathname: '/customers',
    search: '?page=2',
    state: mockLocationState(),
  }),
}))

jest.mock('~/core/utils/billingAccounts', () => ({
  startBillingAccount: (args: unknown) => mockStartBillingAccount(args),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (toast: unknown) => mockAddToast(toast),
}))

jest.mock('~/core/router/utils/counterpartPath', () => ({
  getCounterpartPath: (args: unknown) => mockGetCounterpartPath(args),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

const SANDBOX_ID = 'sandbox-id'
const PRODUCTION_ID = 'production-id'
const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_123'
const SANDBOX_PATH = '/acme-sandbox/customers?page=2'

const pendingOrganization = {
  id: PRODUCTION_ID,
  name: 'Acme Inc.',
  logoUrl: null,
  sandboxOrganization: { id: SANDBOX_ID },
}

const sandboxMembership = (accessibleByCurrentSession = true) => ({
  organization: { id: SANDBOX_ID, slug: 'acme-sandbox', accessibleByCurrentSession },
})

const renderShell = (
  organization: Parameters<
    typeof PendingOrganizationShell
  >[0]['organization'] = pendingOrganization,
) => render(<PendingOrganizationShell organization={organization} />)

// jsdom locks `window.location`; its methods can only be stubbed on the implementation object.
const getLocationImpl = (): Location => {
  const implSymbol = Object.getOwnPropertySymbols(window.location).find(
    (symbol) => symbol.description === 'impl',
  ) as symbol

  return (window.location as unknown as Record<symbol, Location>)[implSymbol]
}

const productionMembership = (activationStatus: OrganizationActivationStatusEnum) => ({
  organization: { id: PRODUCTION_ID, activationStatus },
})

const mockRefetchedStatus = (activationStatus: OrganizationActivationStatusEnum): void => {
  mockRefetchCurrentUserInfos.mockResolvedValue({
    data: { currentUser: { memberships: [productionMembership(activationStatus)] } },
  })
}

describe('PendingOrganizationShell', () => {
  let mockAssign: jest.SpyInstance
  let mockReload: jest.SpyInstance
  let mockReplaceState: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCounterpartPath.mockReturnValue(SANDBOX_PATH)
    mockLocationState.mockReturnValue(null)
    mockStartBillingAccount.mockResolvedValue({ checkoutUrl: CHECKOUT_URL })
    mockUseCurrentUser.mockReturnValue({
      currentUser: { memberships: [sandboxMembership()] },
      refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
    })
    mockAssign = jest.spyOn(getLocationImpl(), 'assign').mockImplementation(() => undefined)
    mockReload = jest.spyOn(getLocationImpl(), 'reload').mockImplementation(() => undefined)
    mockReplaceState = jest
      .spyOn(window.history, 'replaceState')
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    // Consumes the one-shot listener a checkout redirect leaves on `window`.
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }))
    jest.restoreAllMocks()
  })

  describe('GIVEN a production organization waiting for a payment method', () => {
    describe('WHEN it is rendered', () => {
      it('THEN should refetch the current user once to read a fresh activation status', () => {
        renderShell()

        expect(mockRefetchCurrentUserInfos).toHaveBeenCalledTimes(1)
      })

      it('THEN should display the skeleton shell with the organization name', () => {
        renderShell()

        expect(screen.getByTestId(PENDING_ORGANIZATION_SHELL_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(PENDING_ORGANIZATION_NAME_TEST_ID)).toHaveTextContent('Acme Inc.')
      })

      it('THEN should display the navigation section titles', () => {
        renderShell()

        const shell = screen.getByTestId(PENDING_ORGANIZATION_SHELL_TEST_ID)

        expect(shell).toHaveTextContent('Configuration')
        expect(shell).toHaveTextContent('Billing & operations')
      })

      it('THEN should display the activation dialog with its copy', () => {
        renderShell()

        expect(screen.getByTestId(PENDING_ORGANIZATION_DIALOG_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toHaveTextContent(
          'Activate your production account',
        )
        expect(screen.getByTestId(DIALOG_BODY_TEST_ID)).toHaveTextContent(
          'Add a payment card to complete your account setup.Your production account will only be activated once your card is authorized.',
        )
        expect(screen.getByTestId(PENDING_ORGANIZATION_CANCEL_BUTTON_TEST_ID)).toHaveTextContent(
          'Cancel',
        )
        expect(
          screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID),
        ).toHaveTextContent('Add a payment method')
      })

      it('THEN should display the organization logo when it has one', () => {
        renderShell({ ...pendingOrganization, logoUrl: 'https://example.com/logo.png' })

        expect(screen.getByAltText("Acme Inc.'s logo")).toHaveAttribute(
          'src',
          'https://example.com/logo.png',
        )
      })
    })

    describe('WHEN the user clicks add a payment method', () => {
      it('THEN should replace the dialog with the loader while billing-accounts starts', async () => {
        const user = userEvent.setup()

        mockStartBillingAccount.mockReturnValue(new Promise(() => undefined))
        renderShell()

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))

        expect(screen.getByTestId(PRODUCTION_ACTIVATION_LOADER_TEST_ID)).toHaveTextContent(
          'Creating your production account ...',
        )
        expect(screen.getByTestId(PENDING_ORGANIZATION_NAME_TEST_ID)).toHaveTextContent('Acme Inc.')
        expect(screen.queryByTestId(PENDING_ORGANIZATION_DIALOG_TEST_ID)).not.toBeInTheDocument()
        expect(mockStartBillingAccount).toHaveBeenCalledWith({
          organizationId: PRODUCTION_ID,
          sandboxOrganizationId: SANDBOX_ID,
        })
      })

      it('THEN should send the user to the checkout page with the sandbox behind it', async () => {
        const user = userEvent.setup()

        renderShell()

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))

        await waitFor(() => expect(mockAssign).toHaveBeenCalledWith(CHECKOUT_URL))
        expect(mockReplaceState).toHaveBeenCalledWith(null, '', SANDBOX_PATH)
        expect(mockReplaceState.mock.invocationCallOrder[0]).toBeLessThan(
          mockAssign.mock.invocationCallOrder[0],
        )
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(mockAddToast).not.toHaveBeenCalled()
      })

      it('THEN should reload the page when the browser restores it from the back-forward cache', async () => {
        const user = userEvent.setup()

        renderShell()

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))
        await waitFor(() => expect(mockAssign).toHaveBeenCalled())

        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))

        expect(mockReload).toHaveBeenCalledTimes(1)
      })

      it('THEN should not reload the page when it is shown again without the back-forward cache', async () => {
        const user = userEvent.setup()

        renderShell()

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))
        await waitFor(() => expect(mockAssign).toHaveBeenCalled())

        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }))

        expect(mockReload).not.toHaveBeenCalled()
      })
    })

    describe('WHEN billing-accounts answers that the account is already active', () => {
      beforeEach(() => {
        mockStartBillingAccount.mockResolvedValue({ checkoutUrl: null })
      })

      it('THEN should refetch the current user and show the activation toast', async () => {
        const user = userEvent.setup()

        renderShell()
        mockRefetchedStatus(OrganizationActivationStatusEnum.Active)

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          ),
        )
        expect(mockRefetchCurrentUserInfos).toHaveBeenCalledTimes(2)
        expect(mockAssign).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      it('THEN should open the sandbox when the organization is still pending', async () => {
        const user = userEvent.setup()

        renderShell()
        mockRefetchedStatus(OrganizationActivationStatusEnum.PendingPaymentMethod)

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockNavigate).toHaveBeenCalledWith(SANDBOX_PATH, {
            replace: true,
            skipSlugPrepend: true,
          }),
        )
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN billing-accounts fails', () => {
      it('THEN should open the sandbox in place of the loader', async () => {
        const user = userEvent.setup()

        mockStartBillingAccount.mockRejectedValue(new Error('billing-accounts answered 500'))
        renderShell()

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockNavigate).toHaveBeenCalledWith(SANDBOX_PATH, {
            replace: true,
            skipSlugPrepend: true,
          }),
        )
        expect(mockAssign).not.toHaveBeenCalled()
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the organization has no sandbox and the user clicks add a payment method', () => {
      it('THEN should go to the home route without calling billing-accounts', async () => {
        const user = userEvent.setup()

        renderShell({ ...pendingOrganization, sandboxOrganization: null })

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true, skipSlugPrepend: true }),
        )
        expect(mockStartBillingAccount).not.toHaveBeenCalled()
      })
    })

    describe('WHEN it is opened right after signup to start the checkout', () => {
      beforeEach(() => {
        mockLocationState.mockReturnValue({ startCheckout: true })
      })

      it('THEN should show the loader without the dialog and start the checkout once', async () => {
        const { rerender } = renderShell()

        expect(screen.getByTestId(PRODUCTION_ACTIVATION_LOADER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(PENDING_ORGANIZATION_DIALOG_TEST_ID)).not.toBeInTheDocument()

        rerender(<PendingOrganizationShell organization={pendingOrganization} />)

        await waitFor(() => expect(mockAssign).toHaveBeenCalledWith(CHECKOUT_URL))
        expect(mockReplaceState).toHaveBeenCalledWith(null, '', SANDBOX_PATH)
        expect(mockStartBillingAccount).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the user clicks cancel', () => {
      it('THEN should open the same page in the sandbox of the pair', async () => {
        const user = userEvent.setup()

        renderShell()

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_CANCEL_BUTTON_TEST_ID))

        expect(mockGetCounterpartPath).toHaveBeenCalledWith({
          targetSlug: 'acme-sandbox',
          strippedPathname: '/customers',
          search: '?page=2',
        })
        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(SANDBOX_PATH, { skipSlugPrepend: true })
        expect(mockNavigate).not.toHaveBeenCalledWith('/', expect.anything())
      })
    })

    describe('WHEN the user presses escape', () => {
      it('THEN should open the sandbox like cancel', async () => {
        const user = userEvent.setup()

        renderShell()

        await user.keyboard('{Escape}')

        expect(mockNavigate).toHaveBeenCalledWith(SANDBOX_PATH, { skipSlugPrepend: true })
      })
    })

    describe.each([
      [
        'the organization has no sandbox',
        { ...pendingOrganization, sandboxOrganization: null },
        [sandboxMembership()],
      ],
      ['the session cannot open the sandbox', pendingOrganization, [sandboxMembership(false)]],
      ['the user is not a member of the sandbox', pendingOrganization, []],
    ])('WHEN %s and the user clicks cancel', (_, organization, memberships) => {
      it('THEN should go to the home route instead', async () => {
        const user = userEvent.setup()

        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships },
          refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
        })
        renderShell(organization)

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_CANCEL_BUTTON_TEST_ID))

        expect(mockGetCounterpartPath).not.toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/', { skipSlugPrepend: true })
        expect(mockNavigate).not.toHaveBeenCalledWith(SANDBOX_PATH, expect.anything())
      })
    })
  })
})
