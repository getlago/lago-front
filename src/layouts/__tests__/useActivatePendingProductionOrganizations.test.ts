import { renderHook, waitFor } from '@testing-library/react'

import {
  CurrentUserInfosFragment,
  OrganizationActivationStatusEnum,
  OrganizationEnvironmentEnum,
} from '~/generated/graphql'

import {
  markProductionActivationAttempted,
  useActivatePendingProductionOrganizations,
} from '../useActivatePendingProductionOrganizations'

const mockActivateBillingAccount = jest.fn()
const mockRefetchCurrentUserInfos = jest.fn()
const mockAddToast = jest.fn()
const mockEnvGlobalVar = jest.fn()
const mockUseCurrentUser = jest.fn()
const mockUseLocation = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => mockUseParams(),
}))

jest.mock('~/core/router', () => ({
  useLocation: () => mockUseLocation(),
}))

jest.mock('~/core/apolloClient', () => ({
  addToast: (toast: unknown) => mockAddToast(toast),
  envGlobalVar: () => mockEnvGlobalVar(),
}))

jest.mock('~/core/utils/billingAccounts', () => ({
  activateBillingAccount: (organizationId: string) => mockActivateBillingAccount(organizationId),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

type OrganizationOverrides = Partial<
  Pick<
    CurrentUserInfosFragment['memberships'][number]['organization'],
    'id' | 'slug' | 'environment' | 'activationStatus' | 'accessibleByCurrentSession'
  >
>

const buildMembership = (overrides: OrganizationOverrides) => ({
  organization: {
    id: 'production-id',
    slug: 'acme',
    environment: OrganizationEnvironmentEnum.Production,
    activationStatus: OrganizationActivationStatusEnum.PendingPaymentMethod,
    accessibleByCurrentSession: true,
    ...overrides,
  },
})

// The hook remembers attempted organizations for the whole app load, so each test uses fresh ids.
let organizationCounter = 0

const nextOrganizationId = (): string => {
  organizationCounter += 1

  return `organization-${organizationCounter}`
}

const mockCurrentUser = (memberships: ReturnType<typeof buildMembership>[] | undefined): void => {
  mockUseCurrentUser.mockReturnValue({
    currentUser: memberships ? { memberships } : undefined,
    refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
  })
}

const flushPromises = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useActivatePendingProductionOrganizations', () => {
  let productionId: string

  beforeEach(() => {
    jest.clearAllMocks()
    productionId = nextOrganizationId()
    mockEnvGlobalVar.mockReturnValue({ billingAccountsUrl: 'https://billing.example.com' })
    mockUseLocation.mockReturnValue({ state: null })
    mockUseParams.mockReturnValue({ organizationSlug: 'acme-sandbox' })
    mockActivateBillingAccount.mockResolvedValue({ isActive: false })
    mockRefetchCurrentUserInfos.mockResolvedValue({})
    mockCurrentUser([
      buildMembership({ id: productionId }),
      buildMembership({
        id: nextOrganizationId(),
        slug: 'acme-sandbox',
        environment: OrganizationEnvironmentEnum.Sandbox,
        activationStatus: OrganizationActivationStatusEnum.Active,
      }),
    ])
  })

  describe('GIVEN the user has a production organization waiting for a card', () => {
    describe('WHEN the current user resolves', () => {
      it('THEN should call Activate for that organization only', async () => {
        renderHook(() => useActivatePendingProductionOrganizations())

        await waitFor(() => expect(mockActivateBillingAccount).toHaveBeenCalledTimes(1))
        expect(mockActivateBillingAccount).toHaveBeenCalledWith(productionId)
      })
    })

    describe('WHEN the hook rerenders, the current user is refetched or the layout remounts', () => {
      it('THEN should call Activate only once', async () => {
        const { rerender, unmount } = renderHook(() => useActivatePendingProductionOrganizations())

        mockCurrentUser([buildMembership({ id: productionId })])
        rerender()
        unmount()
        renderHook(() => useActivatePendingProductionOrganizations())
        await flushPromises()

        expect(mockActivateBillingAccount).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN Activate answers that the organization is active', () => {
      beforeEach(() => {
        mockActivateBillingAccount.mockResolvedValue({ isActive: true })
      })

      it('THEN should refetch the current user, then show the success toast', async () => {
        renderHook(() => useActivatePendingProductionOrganizations())

        await waitFor(() =>
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          ),
        )
        expect(mockRefetchCurrentUserInfos).toHaveBeenCalledTimes(1)
        expect(mockRefetchCurrentUserInfos.mock.invocationCallOrder[0]).toBeLessThan(
          mockAddToast.mock.invocationCallOrder[0],
        )
      })

      it('THEN should still show the success toast when the refetch fails', async () => {
        mockRefetchCurrentUserInfos.mockRejectedValue(new Error('network'))

        renderHook(() => useActivatePendingProductionOrganizations())

        await waitFor(() =>
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          ),
        )
      })
    })

    describe('WHEN Activate answers that the organization is still pending', () => {
      it('THEN should neither refetch the current user nor show a toast', async () => {
        renderHook(() => useActivatePendingProductionOrganizations())

        await waitFor(() => expect(mockActivateBillingAccount).toHaveBeenCalled())
        await flushPromises()

        expect(mockRefetchCurrentUserInfos).not.toHaveBeenCalled()
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN Activate fails', () => {
      it('THEN should neither refetch the current user nor show a toast', async () => {
        mockActivateBillingAccount.mockRejectedValue(new Error('billing-accounts answered 500'))

        renderHook(() => useActivatePendingProductionOrganizations())

        await waitFor(() => expect(mockActivateBillingAccount).toHaveBeenCalled())
        await flushPromises()

        expect(mockRefetchCurrentUserInfos).not.toHaveBeenCalled()
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the billing-accounts URL is not configured', () => {
      it('THEN should not call Activate', async () => {
        mockEnvGlobalVar.mockReturnValue({ billingAccountsUrl: '' })

        renderHook(() => useActivatePendingProductionOrganizations())
        await flushPromises()

        expect(mockActivateBillingAccount).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the pending shell is starting the checkout of that organization', () => {
      beforeEach(() => {
        mockUseParams.mockReturnValue({ organizationSlug: 'acme' })
        mockUseLocation.mockReturnValue({ state: { startCheckout: true } })
      })

      it('THEN should not call Activate, even once the checkout state is gone', async () => {
        const { rerender } = renderHook(() => useActivatePendingProductionOrganizations())

        mockUseParams.mockReturnValue({ organizationSlug: 'acme-sandbox' })
        mockUseLocation.mockReturnValue({ state: null })
        rerender()
        await flushPromises()

        expect(mockActivateBillingAccount).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the return page already called Activate for that organization', () => {
      it('THEN should not call Activate again', async () => {
        markProductionActivationAttempted(productionId)

        renderHook(() => useActivatePendingProductionOrganizations())
        await flushPromises()

        expect(mockActivateBillingAccount).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the checkout state is set while the user views another organization', () => {
      it('THEN should still call Activate for the pending organization', async () => {
        mockUseLocation.mockReturnValue({ state: { startCheckout: true } })

        renderHook(() => useActivatePendingProductionOrganizations())

        await waitFor(() => expect(mockActivateBillingAccount).toHaveBeenCalledWith(productionId))
      })
    })
  })

  describe('GIVEN the current user has not resolved yet', () => {
    describe('WHEN the hook renders', () => {
      it('THEN should not call Activate until it resolves', async () => {
        mockCurrentUser(undefined)

        const { rerender } = renderHook(() => useActivatePendingProductionOrganizations())

        await flushPromises()
        expect(mockActivateBillingAccount).not.toHaveBeenCalled()

        mockCurrentUser([buildMembership({ id: productionId })])
        rerender()

        await waitFor(() => expect(mockActivateBillingAccount).toHaveBeenCalledWith(productionId))
      })
    })
  })

  describe('GIVEN no organization of the user waits for a card', () => {
    describe.each([
      [
        'an active production organization',
        { activationStatus: OrganizationActivationStatusEnum.Active },
      ],
      ['a production organization without activation status', { activationStatus: null }],
      [
        'a sandbox organization waiting for a card',
        { environment: OrganizationEnvironmentEnum.Sandbox },
      ],
      [
        'a pending production organization the session cannot open',
        { accessibleByCurrentSession: false },
      ],
    ])('WHEN the current user only has %s', (_, overrides: OrganizationOverrides) => {
      it('THEN should not call Activate', async () => {
        mockCurrentUser([buildMembership({ id: productionId, ...overrides })])

        renderHook(() => useActivatePendingProductionOrganizations())
        await flushPromises()

        expect(mockActivateBillingAccount).not.toHaveBeenCalled()
      })
    })
  })
})
