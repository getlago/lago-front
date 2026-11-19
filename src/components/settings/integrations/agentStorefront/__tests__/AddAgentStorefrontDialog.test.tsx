import { AnyFormApi } from '@tanstack/react-form'
import { act, cleanup, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement, ReactNode } from 'react'

import { FormDialogProps } from '~/components/dialogs/FormDialog'
import { addToast } from '~/core/apolloClient'
import { LagoApiError, ProviderTypeEnum } from '~/generated/graphql'
import { AllTheProviders, render, testMockNavigateFn } from '~/test-utils'

import {
  ADD_AGENT_STOREFRONT_SUBMIT_TEST_ID,
  useAddAgentStorefrontDialog,
} from '../AddAgentStorefrontDialog'

const mockFormDialogOpen = jest.fn()
const mockCreate = jest.fn()
const mockCreateMutationOptions = jest.fn()
const mockStripeProvidersQuery = jest.fn()
const mockHasOrganizationPremiumAddon = jest.fn()

jest.mock('~/components/dialogs/FormDialog', () => ({
  useFormDialog: () => ({ open: mockFormDialogOpen, close: jest.fn() }),
}))

jest.mock('~/components/form/ComboBox/ComboBoxVirtualizedList', () => ({
  GROUP_ITEM_KEY: 'combobox-group-by',
  ComboBoxVirtualizedList: ({ elements }: { elements: ReactNode[] }) => <>{elements}</>,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasOrganizationPremiumAddon: mockHasOrganizationPremiumAddon,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateAgentStorefrontIntegrationMutation: (options: unknown) => {
    mockCreateMutationOptions(options)

    return [mockCreate]
  },
  useGetStripeProvidersForAgentStorefrontQuery: (options: unknown) =>
    mockStripeProvidersQuery(options),
}))

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <AllTheProviders>{children}</AllTheProviders>
)

const STRIPE_PROVIDERS_DATA = {
  paymentProviders: {
    collection: [
      { __typename: 'StripeProvider', id: 'stripe-1', name: 'Stripe Prod', code: 'stripe_1' },
    ],
  },
}

const buildErrors = (details: Record<string, string[]>): unknown[] => [
  {
    message: 'Unprocessable Entity',
    extensions: { code: LagoApiError.UnprocessableEntity, details },
  },
]

const openDialog = (): FormDialogProps => {
  const { result } = renderHook(() => useAddAgentStorefrontDialog(), { wrapper })

  act(() => {
    result.current.openAddAgentStorefrontDialog()
  })

  return mockFormDialogOpen.mock.calls[0][0]
}

const renderDialog = (payload: FormDialogProps): AnyFormApi => {
  render(
    <>
      {payload.children}
      {payload.mainAction}
    </>,
  )

  return (payload.children as ReactElement<{ form: AnyFormApi }>).props.form
}

const fillRequiredFields = (form: AnyFormApi): void => {
  act(() => {
    form.setFieldValue('name', 'Storefront')
    form.setFieldValue('code', 'storefront')
    form.setFieldValue('paymentProviderCode', 'stripe_1')
  })
}

const submit = async (payload: FormDialogProps): Promise<PromiseSettledResult<unknown>> => {
  let outcome: PromiseSettledResult<unknown> = { status: 'fulfilled', value: undefined }

  await act(async () => {
    ;[outcome] = await Promise.allSettled([payload.form.submit()])
  })

  return outcome
}

describe('useAddAgentStorefrontDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({ reason: 'close' })
    mockHasOrganizationPremiumAddon.mockReturnValue(true)
    mockStripeProvidersQuery.mockReturnValue({ data: STRIPE_PROVIDERS_DATA, loading: false })
  })

  afterEach(cleanup)

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN inspecting the open payload', () => {
      it('THEN should keep the dialog open on error and expose a submit guard', () => {
        const payload = openDialog()

        expect(payload.closeOnError).toBe(false)
        expect(typeof payload.form.submit).toBe('function')
        expect(typeof payload.form.didSubmitSucceed).toBe('function')
      })

      it('THEN should silence only the error details the form maps itself', () => {
        openDialog()

        expect(mockCreateMutationOptions).toHaveBeenCalledWith({
          context: {
            silentErrorDetails: [
              LagoApiError.ValueAlreadyExist,
              LagoApiError.UrlIsInvalid,
              LagoApiError.EventsTargetingWalletsDisabled,
              LagoApiError.PaymentProviderNotFound,
            ],
          },
          refetchQueries: ['integrationsSetting'],
        })
      })
    })

    describe('WHEN the body renders', () => {
      it('THEN should query the stripe payment providers', () => {
        renderDialog(openDialog())

        expect(mockStripeProvidersQuery).toHaveBeenCalledWith({
          variables: { limit: 1000, type: ProviderTypeEnum.Stripe },
        })
      })

      it('THEN should submit the code of the stripe provider picked by name', async () => {
        const user = userEvent.setup()

        mockCreate.mockResolvedValue({ data: { createAgentStorefrontIntegration: { id: 'sf_1' } } })

        const payload = openDialog()
        const form = renderDialog(payload)

        await user.click(screen.getByRole('combobox'))
        await user.click(await screen.findByText('Stripe Prod'))

        act(() => {
          form.setFieldValue('name', 'Storefront')
          form.setFieldValue('code', 'storefront')
        })

        await submit(payload)

        expect(mockCreate).toHaveBeenCalledWith({
          variables: { input: expect.objectContaining({ paymentProviderCode: 'stripe_1' }) },
        })
      })
    })
  })

  describe('GIVEN the required fields are empty', () => {
    describe('WHEN submitting', () => {
      it('THEN should not call the mutation and flag only the required fields', async () => {
        const payload = openDialog()
        const form = renderDialog(payload)

        const outcome = await submit(payload)

        expect(outcome.status).toBe('fulfilled')
        expect(mockCreate).not.toHaveBeenCalled()
        expect(payload.form.didSubmitSucceed?.()).toBe(false)

        await waitFor(() => {
          expect(form.getFieldMeta('name')?.errors.length).toBeGreaterThan(0)
        })
        expect(form.getFieldMeta('code')?.errors.length).toBeGreaterThan(0)
        expect(form.getFieldMeta('paymentProviderCode')?.errors.length).toBeGreaterThan(0)
        expect(form.getFieldMeta('resourceEndpoint')?.errors ?? []).toHaveLength(0)
        expect(form.getFieldMeta('resourceInstructions')?.errors ?? []).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the required fields are filled and both urls are empty', () => {
    describe('WHEN the mutation succeeds', () => {
      it('THEN should send empty urls, toast success and navigate to the details route', async () => {
        mockCreate.mockResolvedValue({ data: { createAgentStorefrontIntegration: { id: 'sf_1' } } })

        const payload = openDialog()
        const form = renderDialog(payload)

        fillRequiredFields(form)

        const outcome = await submit(payload)

        expect(outcome.status).toBe('fulfilled')
        expect(mockCreate).toHaveBeenCalledWith({
          variables: {
            input: {
              name: 'Storefront',
              code: 'storefront',
              paymentProviderCode: 'stripe_1',
              resourceEndpoint: '',
              resourceInstructions: '',
            },
          },
        })
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(testMockNavigateFn).toHaveBeenCalledWith(
          '/settings/integrations/lago/agent-storefront/sf_1',
        )
        expect(payload.form.didSubmitSucceed?.()).toBe(true)
      })
    })

    describe('WHEN the API rejects the endpoint url', () => {
      it('THEN should keep the dialog open with an error on the endpoint field', async () => {
        mockCreate.mockResolvedValue({
          data: { createAgentStorefrontIntegration: null },
          errors: buildErrors({ resourceEndpoint: [LagoApiError.UrlIsInvalid] }),
        })

        const payload = openDialog()
        const form = renderDialog(payload)

        fillRequiredFields(form)

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')
        expect(addToast).not.toHaveBeenCalled()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
        expect(payload.form.didSubmitSucceed?.()).toBe(false)
        expect(form.getFieldMeta('resourceEndpoint')?.errors.length).toBeGreaterThan(0)
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should toast the generic error and not navigate', async () => {
        mockCreate.mockRejectedValue(new Error('Network error'))

        const payload = openDialog()
        const form = renderDialog(payload)

        fillRequiredFields(form)

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API refuses because wallet-targeted events are disabled', () => {
      it('THEN should show the refusal alert and keep submit disabled after an edit', async () => {
        mockCreate.mockResolvedValue({
          data: { createAgentStorefrontIntegration: null },
          errors: buildErrors({ base: [LagoApiError.EventsTargetingWalletsDisabled] }),
        })

        const payload = openDialog()
        const form = renderDialog(payload)

        fillRequiredFields(form)

        expect(screen.queryByTestId('alert-type-danger')).not.toBeInTheDocument()

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')

        await waitFor(() => {
          expect(screen.getByTestId('alert-type-danger')).toBeInTheDocument()
        })
        expect(screen.getByTestId(ADD_AGENT_STOREFRONT_SUBMIT_TEST_ID)).toBeDisabled()

        act(() => {
          form.setFieldValue('name', 'Storefront edited')
        })

        expect(screen.getByTestId('alert-type-danger')).toBeInTheDocument()
        expect(screen.getByTestId(ADD_AGENT_STOREFRONT_SUBMIT_TEST_ID)).toBeDisabled()
      })
    })
  })

  describe('GIVEN the organization lacks wallet-targeted events', () => {
    beforeEach(() => {
      mockHasOrganizationPremiumAddon.mockReturnValue(false)
    })

    describe('WHEN the dialog opens', () => {
      it('THEN should show the refusal alert right away', () => {
        renderDialog(openDialog())

        expect(screen.getByTestId('alert-type-danger')).toBeInTheDocument()
      })
    })

    describe('WHEN every field is filled', () => {
      it('THEN should keep submit disabled and never call the mutation', async () => {
        const payload = openDialog()
        const form = renderDialog(payload)

        fillRequiredFields(form)

        expect(screen.getByTestId(ADD_AGENT_STOREFRONT_SUBMIT_TEST_ID)).toBeDisabled()

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')
        expect(mockCreate).not.toHaveBeenCalled()
      })
    })
  })
})
