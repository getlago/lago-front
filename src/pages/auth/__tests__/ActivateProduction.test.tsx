import { screen, waitFor } from '@testing-library/react'

import { initializeTranslations } from '~/core/apolloClient'
import { OrganizationActivationStatusEnum, OrganizationEnvironmentEnum } from '~/generated/graphql'
import {
  PENDING_ORGANIZATION_NAME_TEST_ID,
  PRODUCTION_ACTIVATION_LOADER_TEST_ID,
} from '~/layouts/PendingOrganizationShell'
import { render } from '~/test-utils'

import ActivateProduction from '../ActivateProduction'

const mockNavigate = jest.fn()
const mockRefetchCurrentUserInfos = jest.fn()
const mockActivateBillingAccount = jest.fn()
const mockAddToast = jest.fn()

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ refetchCurrentUserInfos: mockRefetchCurrentUserInfos }),
}))

jest.mock('~/core/utils/billingAccounts', () => ({
  activateBillingAccount: (organizationId: string) => mockActivateBillingAccount(organizationId),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (toast: unknown) => mockAddToast(toast),
}))

const PRODUCTION_ID = 'production-id'
const SANDBOX_ID = 'sandbox-id'

type OrganizationOverrides = {
  id?: string
  slug?: string
  environment?: OrganizationEnvironmentEnum
  activationStatus?: OrganizationActivationStatusEnum | null
  accessibleByCurrentSession?: boolean
  sandboxOrganization?: { id: string } | null
}

type Membership = ReturnType<typeof buildMembership>

const buildMembership = (overrides: OrganizationOverrides) => ({
  organization: {
    id: PRODUCTION_ID,
    slug: 'acme',
    name: 'Acme Inc.',
    logoUrl: null,
    environment: OrganizationEnvironmentEnum.Production,
    activationStatus: OrganizationActivationStatusEnum.PendingPaymentMethod,
    accessibleByCurrentSession: true,
    sandboxOrganization: { id: SANDBOX_ID },
    ...overrides,
  },
})

const pendingProductionMembership = buildMembership({})
const sandboxMembership = buildMembership({
  id: SANDBOX_ID,
  slug: 'acme-sandbox',
  environment: OrganizationEnvironmentEnum.Sandbox,
  activationStatus: OrganizationActivationStatusEnum.Active,
  sandboxOrganization: null,
})

const refetchedUser = (memberships: Membership[]) => ({ data: { currentUser: { memberships } } })

const mockRefetchedMemberships = (memberships: Membership[]): void => {
  mockRefetchCurrentUserInfos.mockResolvedValue(refetchedUser(memberships))
}

describe('ActivateProduction', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockRefetchedMemberships([pendingProductionMembership, sandboxMembership])
    mockActivateBillingAccount.mockResolvedValue({ isActive: true })
  })

  describe('GIVEN the user has a production organization waiting for a card', () => {
    describe('WHEN the page opens', () => {
      it('THEN should read the current user from the network before calling Activate', async () => {
        render(<ActivateProduction />)

        await waitFor(() => expect(mockActivateBillingAccount).toHaveBeenCalledWith(PRODUCTION_ID))
        expect(mockRefetchCurrentUserInfos.mock.invocationCallOrder[0]).toBeLessThan(
          mockActivateBillingAccount.mock.invocationCallOrder[0],
        )
      })

      it('THEN should show the loader of the production organization while it activates', async () => {
        mockActivateBillingAccount.mockReturnValue(new Promise(() => undefined))

        render(<ActivateProduction />)

        expect(await screen.findByTestId(PRODUCTION_ACTIVATION_LOADER_TEST_ID)).toHaveTextContent(
          'Creating your production account ...',
        )
        expect(screen.getByTestId(PENDING_ORGANIZATION_NAME_TEST_ID)).toHaveTextContent('Acme Inc.')
      })

      it('THEN should call Activate only once across renders', async () => {
        const { rerender } = render(<ActivateProduction />)

        rerender(<ActivateProduction />)

        await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
        expect(mockActivateBillingAccount).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN billing-accounts answers active', () => {
      it('THEN should refresh the user, show the success toast and open production', async () => {
        render(<ActivateProduction />)

        await waitFor(() =>
          expect(mockNavigate).toHaveBeenCalledWith('/acme', {
            replace: true,
            skipSlugPrepend: true,
          }),
        )
        expect(mockRefetchCurrentUserInfos).toHaveBeenCalledTimes(2)
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(mockRefetchCurrentUserInfos.mock.invocationCallOrder[1]).toBeLessThan(
          mockNavigate.mock.invocationCallOrder[0],
        )
      })
    })

    describe('WHEN billing-accounts does not answer active', () => {
      it('THEN should open the sandbox without the toast', async () => {
        mockActivateBillingAccount.mockResolvedValue({ isActive: false })

        render(<ActivateProduction />)

        await waitFor(() =>
          expect(mockNavigate).toHaveBeenCalledWith('/acme-sandbox', {
            replace: true,
            skipSlugPrepend: true,
          }),
        )
        expect(mockAddToast).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalledWith('/acme', expect.anything())
      })
    })

    describe('WHEN billing-accounts fails', () => {
      it('THEN should open the sandbox', async () => {
        mockActivateBillingAccount.mockRejectedValue(new Error('billing-accounts answered 500'))

        render(<ActivateProduction />)

        await waitFor(() =>
          expect(mockNavigate).toHaveBeenCalledWith('/acme-sandbox', {
            replace: true,
            skipSlugPrepend: true,
          }),
        )
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN refreshing the user fails after the activation', () => {
      it('THEN should open the sandbox', async () => {
        mockRefetchCurrentUserInfos
          .mockResolvedValueOnce(refetchedUser([pendingProductionMembership, sandboxMembership]))
          .mockRejectedValueOnce(new Error('network'))

        render(<ActivateProduction />)

        await waitFor(() =>
          expect(mockNavigate).toHaveBeenCalledWith('/acme-sandbox', {
            replace: true,
            skipSlugPrepend: true,
          }),
        )
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the session cannot open the sandbox and billing-accounts fails', () => {
      it('THEN should go to the home route', async () => {
        mockRefetchedMemberships([
          pendingProductionMembership,
          buildMembership({ ...sandboxMembership.organization, accessibleByCurrentSession: false }),
        ])
        mockActivateBillingAccount.mockRejectedValue(new Error('billing-accounts answered 500'))

        render(<ActivateProduction />)

        await waitFor(() =>
          expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true, skipSlugPrepend: true }),
        )
      })
    })
  })

  describe.each([
    ['no membership', []],
    [
      'an active production organization',
      [buildMembership({ activationStatus: OrganizationActivationStatusEnum.Active })],
    ],
    [
      'a pending organization in the sandbox environment',
      [buildMembership({ environment: OrganizationEnvironmentEnum.Sandbox })],
    ],
    [
      'a pending production organization the session cannot open',
      [buildMembership({ accessibleByCurrentSession: false })],
    ],
  ])('GIVEN the refreshed user has %s', (_, memberships) => {
    describe('WHEN the page opens', () => {
      it('THEN should go to the home route without calling billing-accounts', async () => {
        mockRefetchedMemberships(memberships)

        render(<ActivateProduction />)

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }))
        expect(mockActivateBillingAccount).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN reading the current user fails', () => {
    describe('WHEN the page opens', () => {
      it('THEN should go to the home route without calling billing-accounts', async () => {
        mockRefetchCurrentUserInfos.mockRejectedValue(new Error('network'))

        render(<ActivateProduction />)

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }))
        expect(mockActivateBillingAccount).not.toHaveBeenCalled()
        expect(screen.queryByTestId(PRODUCTION_ACTIVATION_LOADER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the current user is still loading from the network', () => {
    describe('WHEN the page opens', () => {
      it('THEN should wait without calling billing-accounts or navigating', () => {
        mockRefetchCurrentUserInfos.mockReturnValue(new Promise(() => undefined))

        render(<ActivateProduction />)

        expect(screen.queryByTestId(PRODUCTION_ACTIVATION_LOADER_TEST_ID)).not.toBeInTheDocument()
        expect(mockActivateBillingAccount).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })
})
