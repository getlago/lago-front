import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DIALOG_BODY_TEST_ID, DIALOG_TITLE_TEST_ID } from '~/components/dialogs/const'
import { render } from '~/test-utils'

import {
  PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID,
  PENDING_ORGANIZATION_CANCEL_BUTTON_TEST_ID,
  PENDING_ORGANIZATION_DIALOG_TEST_ID,
  PENDING_ORGANIZATION_NAME_TEST_ID,
  PENDING_ORGANIZATION_SHELL_TEST_ID,
  PendingOrganizationShell,
} from '../PendingOrganizationShell'

const mockNavigate = jest.fn()
const mockUseCurrentUser = jest.fn()
const mockGetCounterpartPath = jest.fn()
const mockRefetchCurrentUserInfos = jest.fn()

jest.mock('~/core/router', () => ({
  HOME_ROUTE: '/',
  useNavigate: () => mockNavigate,
  useLocation: () => ({ strippedPathname: '/customers', search: '?page=2' }),
}))

jest.mock('~/core/router/utils/counterpartPath', () => ({
  getCounterpartPath: (args: unknown) => mockGetCounterpartPath(args),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

const SANDBOX_ID = 'sandbox-id'
const SANDBOX_PATH = '/acme-sandbox/customers?page=2'

const pendingOrganization = {
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
  onAddPaymentMethod = jest.fn(),
) =>
  render(
    <PendingOrganizationShell
      organization={organization}
      onAddPaymentMethod={onAddPaymentMethod}
    />,
  )

describe('PendingOrganizationShell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCounterpartPath.mockReturnValue(SANDBOX_PATH)
    mockUseCurrentUser.mockReturnValue({
      currentUser: { memberships: [sandboxMembership()] },
      refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
    })
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
      it('THEN should call the callback and keep the dialog open', async () => {
        const user = userEvent.setup()
        const onAddPaymentMethod = jest.fn()

        renderShell(pendingOrganization, onAddPaymentMethod)

        await user.click(screen.getByTestId(PENDING_ORGANIZATION_ADD_PAYMENT_METHOD_BUTTON_TEST_ID))

        expect(onAddPaymentMethod).toHaveBeenCalledTimes(1)
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(screen.getByTestId(PENDING_ORGANIZATION_DIALOG_TEST_ID)).toBeInTheDocument()
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
