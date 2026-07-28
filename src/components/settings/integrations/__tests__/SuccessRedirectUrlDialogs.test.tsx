import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { AllTheProviders } from '~/test-utils'

import {
  useAddEditSuccessRedirectUrlDialog,
  useDeleteSuccessRedirectUrlDialog,
} from '../SuccessRedirectUrlDialogs'

const mockFormDialogOpen = jest.fn()
const mockCentralizedDialogOpen = jest.fn()

const mockUpdateAdyenProvider = jest.fn()
const mockUpdateCashfreeProvider = jest.fn()
const mockUpdateFlutterwaveProvider = jest.fn()
const mockUpdateGocardlessProvider = jest.fn()
const mockUpdateStripeProvider = jest.fn()
const mockUpdateMoneyhashProvider = jest.fn()

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({ open: mockFormDialogOpen, close: jest.fn() }),
}))

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockCentralizedDialogOpen }),
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
  useUpdateAdyenPaymentProviderMutation: () => [mockUpdateAdyenProvider],
  useUpdateCashfreePaymentProviderMutation: () => [mockUpdateCashfreeProvider],
  useUpdateFlutterwavePaymentProviderSuccessRedirectUrlMutation: () => [
    mockUpdateFlutterwaveProvider,
  ],
  useUpdateGocardlessPaymentProviderMutation: () => [mockUpdateGocardlessProvider],
  useUpdateStripePaymentProviderMutation: () => [mockUpdateStripeProvider],
  useUpdateMoneyhashPaymentProviderMutation: () => [mockUpdateMoneyhashProvider],
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const PROVIDER_MUTATIONS = [
  { type: 'Adyen' as const, mock: mockUpdateAdyenProvider },
  { type: 'Stripe' as const, mock: mockUpdateStripeProvider },
  { type: 'GoCardless' as const, mock: mockUpdateGocardlessProvider },
  { type: 'Cashfree' as const, mock: mockUpdateCashfreeProvider },
  { type: 'Flutterwave' as const, mock: mockUpdateFlutterwaveProvider },
  { type: 'Moneyhash' as const, mock: mockUpdateMoneyhashProvider },
]

describe('useAddEditSuccessRedirectUrlDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({ reason: 'close' })
  })

  describe('GIVEN the hook is called', () => {
    describe('WHEN it returns', () => {
      it('THEN should return openAddEditSuccessRedirectUrlDialog function', () => {
        const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

        expect(typeof result.current.openAddEditSuccessRedirectUrlDialog).toBe('function')
      })
    })
  })

  describe('GIVEN openAddEditSuccessRedirectUrlDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should call formDialog.open with closeOnError false and a submittable form', () => {
        const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

        act(() => {
          result.current.openAddEditSuccessRedirectUrlDialog({ mode: 'Add', type: 'Stripe' })
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs.closeOnError).toBe(false)
        expect(callArgs.form.id).toBe('success-redirect-url-form')
        expect(typeof callArgs.form.submit).toBe('function')
      })
    })

    describe.each(PROVIDER_MUTATIONS)(
      'WHEN submitting for provider type $type',
      ({ type, mock }) => {
        it('THEN should call the matching mutation with the provider id and url', async () => {
          mock.mockResolvedValue({ data: {}, errors: undefined })
          mockFormDialogOpen.mockImplementation(async (config) => {
            await config.form.submit()
            return { reason: 'success' }
          })

          const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

          await act(async () => {
            result.current.openAddEditSuccessRedirectUrlDialog({
              mode: 'Edit',
              type,
              provider: { id: 'provider-1', successRedirectUrl: 'https://old.example.com' },
            })
          })

          expect(mock).toHaveBeenCalledWith({
            variables: {
              input: { id: 'provider-1', successRedirectUrl: 'https://old.example.com' },
            },
          })
        })
      },
    )

    describe('WHEN submitting with an empty successRedirectUrl', () => {
      it('THEN should reject the submit without calling the mutation (field is required)', async () => {
        mockFormDialogOpen.mockImplementation(async (config) => {
          await expect(config.form.submit()).rejects.toThrow('Submit failed')
          return { reason: 'close' }
        })

        const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

        await act(async () => {
          result.current.openAddEditSuccessRedirectUrlDialog({
            mode: 'Edit',
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: '' },
          })
        })

        expect(mockUpdateStripeProvider).not.toHaveBeenCalled()
      })
    })

    describe('WHEN submitting with a non-URL value', () => {
      it('THEN should reject the submit without calling the mutation', async () => {
        mockFormDialogOpen.mockImplementation(async (config) => {
          await expect(config.form.submit()).rejects.toThrow('Submit failed')
          return { reason: 'close' }
        })

        const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

        await act(async () => {
          result.current.openAddEditSuccessRedirectUrlDialog({
            mode: 'Edit',
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: 'not-a-url' },
          })
        })

        expect(mockUpdateStripeProvider).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the mutation succeeds', () => {
      it('THEN should show the add success toast in Add mode', async () => {
        mockUpdateStripeProvider.mockResolvedValue({ data: {}, errors: undefined })
        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          return { reason: 'success' }
        })

        const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

        await act(async () => {
          result.current.openAddEditSuccessRedirectUrlDialog({
            mode: 'Add',
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: 'https://example.com' },
          })
        })

        expect(addToast).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'text_65367cb78324b77fcb6af261',
            severity: 'success',
          }),
        )
      })

      it('THEN should show the edit success toast in Edit mode', async () => {
        mockUpdateStripeProvider.mockResolvedValue({ data: {}, errors: undefined })
        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          return { reason: 'success' }
        })

        const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

        await act(async () => {
          result.current.openAddEditSuccessRedirectUrlDialog({
            mode: 'Edit',
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: 'https://old.example.com' },
          })
        })

        expect(addToast).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'text_65367cb78324b77fcb6af28f',
            severity: 'success',
          }),
        )
      })
    })

    describe('WHEN the mutation returns a UrlIsInvalid GraphQL error', () => {
      it('THEN should reject the submit and not show a success toast', async () => {
        mockUpdateStripeProvider.mockResolvedValue({
          errors: [{ message: 'UrlIsInvalid', extensions: { code: 'UrlIsInvalid' } }],
        })
        mockFormDialogOpen.mockImplementation(async (config) => {
          await expect(config.form.submit()).rejects.toThrow('Submit failed')
          return { reason: 'close' }
        })

        const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

        await act(async () => {
          result.current.openAddEditSuccessRedirectUrlDialog({
            mode: 'Add',
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: 'https://example.com' },
          })
        })

        expect(mockUpdateStripeProvider).toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the mutation returns a non-UrlIsInvalid GraphQL error', () => {
      it('THEN should reject the submit and not show a success toast', async () => {
        mockUpdateStripeProvider.mockResolvedValue({
          errors: [{ message: 'SomeOtherError', extensions: { code: 'SomeOtherError' } }],
        })
        mockFormDialogOpen.mockImplementation(async (config) => {
          await expect(config.form.submit()).rejects.toThrow('Submit failed')
          return { reason: 'close' }
        })

        const { result } = renderHook(() => useAddEditSuccessRedirectUrlDialog(), { wrapper })

        await act(async () => {
          result.current.openAddEditSuccessRedirectUrlDialog({
            mode: 'Add',
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: 'https://example.com' },
          })
        })

        expect(mockUpdateStripeProvider).toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })
})

describe('useDeleteSuccessRedirectUrlDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is called', () => {
    describe('WHEN it returns', () => {
      it('THEN should return openDeleteSuccessRedirectUrlDialog function', () => {
        const { result } = renderHook(() => useDeleteSuccessRedirectUrlDialog(), { wrapper })

        expect(typeof result.current.openDeleteSuccessRedirectUrlDialog).toBe('function')
      })
    })
  })

  describe('GIVEN openDeleteSuccessRedirectUrlDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should open with danger variant and connectionName in the description', () => {
        const { result } = renderHook(() => useDeleteSuccessRedirectUrlDialog(), { wrapper })

        act(() => {
          result.current.openDeleteSuccessRedirectUrlDialog({
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: 'https://old.example.com' },
          })
        })

        expect(mockCentralizedDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            colorVariant: 'danger',
            title: expect.any(String),
            description: expect.anything(),
            actionText: expect.any(String),
          }),
        )
      })
    })

    describe.each(PROVIDER_MUTATIONS)(
      'WHEN onAction is triggered for provider type $type',
      ({ type, mock }) => {
        it('THEN should call the matching mutation with a null successRedirectUrl', async () => {
          mock.mockResolvedValue({ data: {}, errors: undefined })

          const { result } = renderHook(() => useDeleteSuccessRedirectUrlDialog(), { wrapper })

          act(() => {
            result.current.openDeleteSuccessRedirectUrlDialog({
              type,
              provider: { id: 'provider-1', successRedirectUrl: 'https://old.example.com' },
            })
          })

          const onAction = mockCentralizedDialogOpen.mock.calls[0][0].onAction

          await act(async () => {
            await onAction()
          })

          expect(mock).toHaveBeenCalledWith({
            variables: { input: { id: 'provider-1', successRedirectUrl: null } },
          })
        })
      },
    )

    describe('WHEN the mutation succeeds', () => {
      it('THEN should show a success toast', async () => {
        mockUpdateStripeProvider.mockResolvedValue({ data: {}, errors: undefined })

        const { result } = renderHook(() => useDeleteSuccessRedirectUrlDialog(), { wrapper })

        act(() => {
          result.current.openDeleteSuccessRedirectUrlDialog({
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: 'https://old.example.com' },
          })
        })

        const onAction = mockCentralizedDialogOpen.mock.calls[0][0].onAction

        await act(async () => {
          await onAction()
        })

        expect(addToast).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'text_65367cb78324b77fcb6af2c1',
            severity: 'success',
          }),
        )
      })
    })

    describe('WHEN the mutation returns errors', () => {
      it('THEN should not show a success toast', async () => {
        mockUpdateStripeProvider.mockResolvedValue({
          errors: [{ message: 'SomeError', extensions: { code: 'SomeError' } }],
        })

        const { result } = renderHook(() => useDeleteSuccessRedirectUrlDialog(), { wrapper })

        act(() => {
          result.current.openDeleteSuccessRedirectUrlDialog({
            type: 'Stripe',
            provider: { id: 'provider-1', successRedirectUrl: 'https://old.example.com' },
          })
        })

        const onAction = mockCentralizedDialogOpen.mock.calls[0][0].onAction

        await act(async () => {
          await onAction()
        })

        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })
})
