import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { CentralizedDialogProps } from '~/components/dialogs/CentralizedDialog'
import { addToast, onNetworkError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteStripeIntegrationDialogFragment,
  GetStripeIntegrationsListDocument,
  IntegrationTypeEnum,
  LagoApiError,
} from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { useDeleteStripeIntegrationDialog } from '../DeleteStripeIntegrationDialog'

const mockCentralizedDialogOpen = jest.fn()
const mockDeleteStripe = jest.fn()
const mockStorefrontsQuery = jest.fn()
const mockHasFeatureFlag = jest.fn()
const mockHasOrganizationPremiumAddon = jest.fn()
const mockHasPermissions = jest.fn()
const mockTranslate = jest.fn((key: string) => key)

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockCentralizedDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/apolloClient/evictFromCache', () => ({
  evictFromCache: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: mockTranslate }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasFeatureFlag: mockHasFeatureFlag,
    hasOrganizationPremiumAddon: mockHasOrganizationPremiumAddon,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDeleteStripeMutation: () => [mockDeleteStripe],
  useGetAgentStorefrontsForStripeDeletionQuery: (options: unknown) => mockStorefrontsQuery(options),
}))

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <AllTheProviders>{children}</AllTheProviders>
)

const PROVIDER: DeleteStripeIntegrationDialogFragment = {
  __typename: 'StripeProvider',
  id: 'stripe-1',
  name: 'Stripe Prod',
  code: 'stripe_prod',
}

const STOREFRONTS_DATA = {
  integrations: {
    collection: [
      {
        __typename: 'AgentStorefrontIntegration',
        id: 'sf_1',
        name: 'Agentic Flow A',
        paymentProviderCode: 'stripe_prod',
      },
    ],
  },
}

const USED_BY_STOREFRONT_RESULT = {
  data: { destroyPaymentProvider: null },
  errors: [
    {
      message: 'Method Not Allowed',
      extensions: { code: LagoApiError.PaymentProviderUsedByAgentStorefront },
    },
  ],
}

const enableStorefront = (isEnabled: boolean): void => {
  mockHasFeatureFlag.mockReturnValue(isEnabled)
  mockHasOrganizationPremiumAddon.mockReturnValue(isEnabled)
}

const getProps = (
  provider: DeleteStripeIntegrationDialogFragment = PROVIDER,
  callback?: () => void,
): CentralizedDialogProps => {
  const { result } = renderHook(() => useDeleteStripeIntegrationDialog(), { wrapper })

  return result.current.getDeleteStripeIntegrationDialogProps({ provider, callback })
}

describe('useDeleteStripeIntegrationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    enableStorefront(true)
    mockHasPermissions.mockReturnValue(true)
    mockStorefrontsQuery.mockReturnValue({ data: STOREFRONTS_DATA })
  })

  describe('GIVEN the organization has the Agentic Storefront', () => {
    describe('WHEN the hook mounts', () => {
      it('THEN should look up the Storefront connections', () => {
        getProps()

        expect(mockStorefrontsQuery).toHaveBeenCalledWith({
          variables: { limit: 100, types: [IntegrationTypeEnum.AgentStorefront] },
          skip: false,
        })
      })
    })

    describe('WHEN a Storefront connection uses this Stripe connection', () => {
      it('THEN should refuse the delete and name the Storefront connection in a warning', () => {
        const props = getProps()

        expect(props.disableOnContinue).toBe(true)
        expect(mockTranslate).toHaveBeenCalledWith(expect.any(String), {
          connectionName: 'Agentic Flow A',
        })

        const { getByTestId } = render(<>{props.children}</>)

        expect(getByTestId('alert-type-warning')).toBeInTheDocument()
      })
    })

    describe('WHEN no Storefront connection uses this Stripe connection', () => {
      it('THEN should allow the delete without a warning', () => {
        const props = getProps({ ...PROVIDER, code: 'stripe_other' })

        expect(props.disableOnContinue).toBe(false)
        expect(props.children).toBeUndefined()
      })
    })
  })

  describe.each([
    ['the Agentic Storefront is disabled', false, true],
    ['the user cannot view integrations', true, false],
  ])('GIVEN %s', (_, isStorefrontEnabled, canViewIntegrations) => {
    describe('WHEN the hook mounts', () => {
      it('THEN should skip the Storefront lookup', () => {
        enableStorefront(isStorefrontEnabled)
        mockHasPermissions.mockReturnValue(canViewIntegrations)
        mockStorefrontsQuery.mockReturnValue({ data: undefined })

        const props = getProps()

        expect(mockStorefrontsQuery).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
        expect(props.disableOnContinue).toBe(false)
      })
    })
  })

  describe('GIVEN the delete is allowed', () => {
    describe('WHEN building the dialog props', () => {
      it('THEN should keep the dialog open on network errors', () => {
        expect(getProps({ ...PROVIDER, code: 'stripe_other' })).toEqual(
          expect.objectContaining({
            colorVariant: 'danger',
            closeOnError: false,
            onError: onNetworkError,
          }),
        )
      })
    })

    describe('WHEN the delete succeeds', () => {
      it('THEN should evict the connection, run the callback and toast success', async () => {
        const callback = jest.fn()

        mockDeleteStripe.mockResolvedValue({ data: { destroyPaymentProvider: { id: 'stripe-1' } } })

        const props = getProps({ ...PROVIDER, code: 'stripe_other' }, callback)

        await act(async () => {
          await props.onAction()
        })

        expect(mockDeleteStripe).toHaveBeenCalledWith({
          variables: { input: { id: 'stripe-1' } },
          context: { silentErrorCodes: [LagoApiError.PaymentProviderUsedByAgentStorefront] },
        })
        expect(evictFromCache).toHaveBeenCalledWith(expect.anything(), {
          id: 'stripe-1',
          __typename: 'StripeProvider',
          listFieldName: 'paymentProviders',
          listQueryDocument: GetStripeIntegrationsListDocument,
        })
        expect(callback).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })

    describe('WHEN the API refuses because a Storefront connection uses it', () => {
      it('THEN should toast the refusal instead of evicting the connection', async () => {
        const callback = jest.fn()

        mockDeleteStripe.mockResolvedValue(USED_BY_STOREFRONT_RESULT)

        const props = getProps({ ...PROVIDER, code: 'stripe_other' }, callback)

        await act(async () => {
          await props.onAction()
        })

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(evictFromCache).not.toHaveBeenCalled()
        expect(callback).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the delete fails on the network', () => {
      it('THEN should reject so the dialog stays open', async () => {
        const networkError = new Error('Network error')
        const callback = jest.fn()

        mockDeleteStripe.mockRejectedValue(networkError)

        const props = getProps({ ...PROVIDER, code: 'stripe_other' }, callback)

        await expect(props.onAction()).rejects.toBe(networkError)
        expect(callback).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the dialog is opened directly', () => {
    describe('WHEN calling openDeleteStripeIntegrationDialog', () => {
      it('THEN should open the centralized dialog with the refused props', () => {
        mockCentralizedDialogOpen.mockResolvedValue({ reason: 'close' })

        const { result } = renderHook(() => useDeleteStripeIntegrationDialog(), { wrapper })

        act(() => {
          result.current.openDeleteStripeIntegrationDialog({ provider: PROVIDER })
        })

        expect(mockCentralizedDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ disableOnContinue: true }),
        )
      })
    })
  })
})
