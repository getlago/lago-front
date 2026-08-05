import { act, cleanup, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import {
  AddStripeApiKeyMutation,
  AddStripeProviderDialogFragment,
  UpdateStripeApiKeyMutation,
} from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { useAddStripeDialog } from '../AddStripeDialog'

const NAME_INPUT_PLACEHOLDER_KEY = 'text_6584550dc4cec7adf861504f'
const SECRET_KEY_INPUT_PLACEHOLDER_KEY = 'text_62b1edddbf5f461ab9712756'
const CONSENT_SWITCH_NAME = 'requireTermsOfServiceConsent'

const mockDialogOpen = jest.fn()
const mockAddApiKey = jest.fn()
const mockUpdateApiKey = jest.fn()
const mockGetProviderByCode = jest.fn()
const mockDeleteStripe = jest.fn()

type AddMutationOptions = { onCompleted?: (data: AddStripeApiKeyMutation) => void }
type UpdateMutationOptions = { onCompleted?: (data: UpdateStripeApiKeyMutation) => void }

let mockAddApiKeyOptions: AddMutationOptions | undefined
let mockUpdateApiKeyOptions: UpdateMutationOptions | undefined

jest.mock('~/components/dialogs/FormDialogOpeningDialog', () => ({
  useFormDialogOpeningDialog: () => ({ open: mockDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useAddStripeApiKeyMutation: (options?: AddMutationOptions) => {
    mockAddApiKeyOptions = options
    return [mockAddApiKey]
  },
  useUpdateStripeApiKeyMutation: (options?: UpdateMutationOptions) => {
    mockUpdateApiKeyOptions = options
    return [mockUpdateApiKey]
  },
  useGetProviderByCodeForStripeLazyQuery: () => [mockGetProviderByCode],
  useDeleteStripeMutation: () => [mockDeleteStripe],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const stripeProvider: AddStripeProviderDialogFragment = {
  __typename: 'StripeProvider',
  id: 'stripe-provider-id',
  name: 'Test Integration',
  code: 'test_integration',
  secretKey: 'sk_****1234',
  supports3ds: false,
  requireTermsOfServiceConsent: true,
}

describe('useAddStripeDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()

    // Keep the dialog pending so the `.then` cleanup does not reset the form mid-test
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
    mockGetProviderByCode.mockResolvedValue({ data: { paymentProvider: null } })
    mockAddApiKey.mockImplementation(async () => {
      const data: AddStripeApiKeyMutation = {
        addStripePaymentProvider: {
          __typename: 'StripeProvider',
          id: 'new-stripe-provider-id',
          name: 'Test Integration',
          code: 'test_integration',
        },
      }

      mockAddApiKeyOptions?.onCompleted?.(data)
      return { data }
    })
    mockUpdateApiKey.mockImplementation(async () => {
      const data: UpdateStripeApiKeyMutation = {
        updateStripePaymentProvider: {
          __typename: 'StripeProvider',
          id: 'stripe-provider-id',
          name: 'Test Integration',
          code: 'test_integration',
        },
      }

      mockUpdateApiKeyOptions?.onCompleted?.(data)
      return { data }
    })
  })

  describe('GIVEN the dialog is opened in creation mode', () => {
    describe('WHEN rendering the dialog content', () => {
      it('THEN renders the consent collection switch unchecked by default', async () => {
        const { result } = renderHook(() => useAddStripeDialog(), { wrapper })

        act(() => {
          result.current.openAddStripeDialog()
        })

        const dialogProps = mockDialogOpen.mock.calls[0][0]

        await act(() => render(<>{dialogProps.children}</>))

        expect(screen.getByRole('checkbox', { name: CONSENT_SWITCH_NAME })).not.toBeChecked()
      })
    })

    describe('WHEN submitting with the consent collection switch enabled', () => {
      it('THEN calls the add mutation with requireTermsOfServiceConsent true', async () => {
        const user = userEvent.setup()
        const { result } = renderHook(() => useAddStripeDialog(), { wrapper })

        act(() => {
          result.current.openAddStripeDialog()
        })

        const dialogProps = mockDialogOpen.mock.calls[0][0]

        await act(() => render(<>{dialogProps.children}</>))

        await user.type(screen.getByPlaceholderText(NAME_INPUT_PLACEHOLDER_KEY), 'My Stripe')
        await user.type(
          screen.getByPlaceholderText(SECRET_KEY_INPUT_PLACEHOLDER_KEY),
          'sk_test_123',
        )
        await user.click(screen.getByRole('checkbox', { name: CONSENT_SWITCH_NAME }))

        await act(async () => {
          await dialogProps.form.submit()
        })

        expect(mockAddApiKey).toHaveBeenCalledWith({
          variables: {
            input: {
              name: 'My Stripe',
              code: 'my_stripe',
              secretKey: 'sk_test_123',
              supports3ds: false,
              requireTermsOfServiceConsent: true,
            },
          },
        })
      })
    })
  })

  describe('GIVEN the dialog is opened in edition mode', () => {
    describe('WHEN the provider has consent collection enabled', () => {
      it('THEN renders the consent collection switch checked', async () => {
        const { result } = renderHook(() => useAddStripeDialog(), { wrapper })

        act(() => {
          result.current.openAddStripeDialog({ provider: stripeProvider })
        })

        const dialogProps = mockDialogOpen.mock.calls[0][0]

        await act(() => render(<>{dialogProps.children}</>))

        expect(screen.getByRole('checkbox', { name: CONSENT_SWITCH_NAME })).toBeChecked()
      })

      it('THEN calls the update mutation with requireTermsOfServiceConsent true', async () => {
        const { result } = renderHook(() => useAddStripeDialog(), { wrapper })

        act(() => {
          result.current.openAddStripeDialog({ provider: stripeProvider })
        })

        const dialogProps = mockDialogOpen.mock.calls[0][0]

        await act(async () => {
          await dialogProps.form.submit()
        })

        expect(mockUpdateApiKey).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'stripe-provider-id',
              name: 'Test Integration',
              code: 'test_integration',
              supports3ds: false,
              requireTermsOfServiceConsent: true,
            },
          },
        })
      })
    })

    describe('WHEN the provider has no consent collection value', () => {
      it('THEN calls the update mutation with requireTermsOfServiceConsent false', async () => {
        const { result } = renderHook(() => useAddStripeDialog(), { wrapper })

        act(() => {
          result.current.openAddStripeDialog({
            provider: { ...stripeProvider, requireTermsOfServiceConsent: null },
          })
        })

        const dialogProps = mockDialogOpen.mock.calls[0][0]

        await act(async () => {
          await dialogProps.form.submit()
        })

        expect(mockUpdateApiKey).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'stripe-provider-id',
              name: 'Test Integration',
              code: 'test_integration',
              supports3ds: false,
              requireTermsOfServiceConsent: false,
            },
          },
        })
      })
    })
  })
})
