import { AnyFormApi } from '@tanstack/react-form'
import { act, cleanup, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement, ReactNode } from 'react'

import { CentralizedDialogProps } from '~/components/dialogs/CentralizedDialog'
import { FormDialogProps } from '~/components/dialogs/FormDialog'
import { FormDialogOpeningDialogProps } from '~/components/dialogs/FormDialogOpeningDialog'
import { addToast, onNetworkError } from '~/core/apolloClient'
import {
  EditAgentStorefrontIntegrationFragment,
  LagoApiError,
  ProviderTypeEnum,
} from '~/generated/graphql'
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
const mockOrganization = jest.fn()
const mockFormDialogOpeningDialogOpen = jest.fn()
const mockUpdate = jest.fn()
const mockUpdateMutationOptions = jest.fn()
const mockHasPermissions = jest.fn()
const mockGetDeleteProps = jest.fn()

jest.mock('~/components/dialogs/FormDialog', () => ({
  useFormDialog: () => ({ open: mockFormDialogOpen, close: jest.fn() }),
}))

jest.mock('~/components/dialogs/FormDialogOpeningDialog', () => ({
  useFormDialogOpeningDialog: () => ({ open: mockFormDialogOpeningDialogOpen, close: jest.fn() }),
}))

jest.mock('../DeleteAgentStorefrontIntegrationDialog', () => ({
  useDeleteAgentStorefrontIntegrationDialog: () => ({
    getDeleteAgentStorefrontIntegrationDialogProps: mockGetDeleteProps,
    openDeleteAgentStorefrontIntegrationDialog: jest.fn(),
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
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
    organization: mockOrganization(),
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
  useUpdateAgentStorefrontIntegrationMutation: (options: unknown) => {
    mockUpdateMutationOptions(options)

    return [mockUpdate]
  },
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

const EVENTS_TARGETING_WALLETS_REFUSAL_KEY = 'text_1795083825205hnjrsshuj3f'
const WALLET_REFRESH_REFUSAL_KEY = 'text_1795177414435gn7pn5ytu3s'

const DELETE_DIALOG_PROPS: CentralizedDialogProps = {
  title: 'Delete',
  actionText: 'Delete',
  onAction: jest.fn(),
}

const createIntegration = (
  overrides: Partial<EditAgentStorefrontIntegrationFragment> = {},
): EditAgentStorefrontIntegrationFragment => ({
  __typename: 'AgentStorefrontIntegration',
  id: 'sf_1',
  name: 'Agentic Flow A',
  code: 'agentic_flow_a',
  paymentProviderCode: 'stripe_1',
  resourceEndpoint: 'https://api.acme.example/count',
  resourceInstructions: null,
  hasAgentsWithStripeCustomer: false,
  hasEnrolledAgents: false,
  ...overrides,
})

const openEditDialog = (
  integration: EditAgentStorefrontIntegrationFragment = createIntegration(),
  deleteCallback?: () => void,
): FormDialogOpeningDialogProps => {
  const { result } = renderHook(() => useAddAgentStorefrontDialog(), { wrapper })

  act(() => {
    result.current.openEditAgentStorefrontDialog({ integration, deleteCallback })
  })

  return mockFormDialogOpeningDialogOpen.mock.calls[0][0]
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

const renderDialog = (payload: FormDialogProps | FormDialogOpeningDialogProps): AnyFormApi => {
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

const submit = async (
  payload: FormDialogProps | FormDialogOpeningDialogProps,
): Promise<PromiseSettledResult<unknown>> => {
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
    mockOrganization.mockReturnValue({ walletRefreshEnabled: true })
    mockStripeProvidersQuery.mockReturnValue({ data: STRIPE_PROVIDERS_DATA, loading: false })
    mockFormDialogOpeningDialogOpen.mockResolvedValue({ reason: 'close' })
    mockHasPermissions.mockReturnValue(true)
    mockGetDeleteProps.mockReturnValue(DELETE_DIALOG_PROPS)
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
              LagoApiError.WalletRefreshUnavailable,
              LagoApiError.PaymentProviderNotFound,
              LagoApiError.AgentStorefrontHasEnrolledAgents,
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

    describe('WHEN the API refuses because wallet refresh is unavailable', () => {
      it('THEN should show the wallet refresh refusal and disable submit', async () => {
        mockCreate.mockResolvedValue({
          data: { createAgentStorefrontIntegration: null },
          errors: buildErrors({ base: [LagoApiError.WalletRefreshUnavailable] }),
        })

        const payload = openDialog()
        const form = renderDialog(payload)

        fillRequiredFields(form)

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')

        await waitFor(() => {
          expect(screen.getByTestId('alert-type-danger')).toHaveTextContent(
            WALLET_REFRESH_REFUSAL_KEY,
          )
        })
        expect(screen.getByTestId(ADD_AGENT_STOREFRONT_SUBMIT_TEST_ID)).toBeDisabled()
        expect(addToast).not.toHaveBeenCalled()
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
      it('THEN should show the wallet-targeted events refusal right away', () => {
        mockOrganization.mockReturnValue({ walletRefreshEnabled: false })

        renderDialog(openDialog())

        expect(screen.getByTestId('alert-type-danger')).toHaveTextContent(
          EVENTS_TARGETING_WALLETS_REFUSAL_KEY,
        )
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

  describe('GIVEN the deployment does not refresh wallets in real time', () => {
    beforeEach(() => {
      mockOrganization.mockReturnValue({ walletRefreshEnabled: false })
    })

    describe('WHEN the dialog opens', () => {
      it('THEN should show the wallet refresh refusal right away', () => {
        renderDialog(openDialog())

        expect(screen.getByTestId('alert-type-danger')).toHaveTextContent(
          WALLET_REFRESH_REFUSAL_KEY,
        )
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

    describe('WHEN an existing connection is edited', () => {
      it('THEN should not refuse the edit', () => {
        renderDialog(openEditDialog())

        expect(screen.queryByTestId('alert-type-danger')).not.toBeInTheDocument()
        expect(screen.getByTestId(ADD_AGENT_STOREFRONT_SUBMIT_TEST_ID)).toBeEnabled()
      })
    })
  })

  describe('GIVEN the organization is not loaded yet', () => {
    describe('WHEN the dialog opens', () => {
      it('THEN should not refuse on wallet refresh', () => {
        mockOrganization.mockReturnValue(undefined)

        renderDialog(openDialog())

        expect(screen.queryByTestId('alert-type-danger')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an existing connection is edited', () => {
    describe('WHEN the dialog opens', () => {
      it('THEN should open the edit dialog with the delete footer wired to the delete dialog', () => {
        const integration = createIntegration()
        const deleteCallback = jest.fn()
        const payload = openEditDialog(integration, deleteCallback)

        expect(mockFormDialogOpen).not.toHaveBeenCalled()
        expect(mockGetDeleteProps).toHaveBeenCalledWith({ integration, callback: deleteCallback })
        expect(payload).toEqual(
          expect.objectContaining({
            closeOnError: false,
            onError: onNetworkError,
            canOpenDialog: true,
            disableOpenDialog: false,
            otherDialogProps: DELETE_DIALOG_PROPS,
          }),
        )
      })

      it('THEN should prefill the form with the connection', () => {
        const form = renderDialog(openEditDialog())

        expect(form.state.values).toEqual({
          name: 'Agentic Flow A',
          code: 'agentic_flow_a',
          resourceEndpoint: 'https://api.acme.example/count',
          resourceInstructions: '',
          paymentProviderCode: 'stripe_1',
          refusalReason: null,
        })
      })

      it('THEN should silence the enrolled-agents refusal on the update mutation', () => {
        openEditDialog()

        expect(mockUpdateMutationOptions).toHaveBeenCalledWith({
          context: {
            silentErrorDetails: expect.arrayContaining([
              LagoApiError.AgentStorefrontHasEnrolledAgents,
            ]),
          },
        })
      })
    })

    describe('WHEN the connection has enrolled agents', () => {
      it('THEN should disable the delete footer button', () => {
        const payload = openEditDialog(createIntegration({ hasEnrolledAgents: true }))

        expect(payload.canOpenDialog).toBe(true)
        expect(payload.disableOpenDialog).toBe(true)
      })
    })

    describe('WHEN the user cannot delete integrations', () => {
      it('THEN should not offer the delete footer button', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('organizationIntegrationsDelete'),
        )

        expect(openEditDialog().canOpenDialog).toBe(false)
      })
    })

    describe.each([
      [true, 'disabled'],
      [false, 'enabled'],
    ])('WHEN hasAgentsWithStripeCustomer is %s', (hasAgentsWithStripeCustomer, state) => {
      it(`THEN should render the payment connection ${state}`, () => {
        renderDialog(openEditDialog(createIntegration({ hasAgentsWithStripeCustomer })))

        const combobox = screen.getByRole('combobox')

        if (hasAgentsWithStripeCustomer) {
          expect(combobox).toBeDisabled()
        } else {
          expect(combobox).not.toBeDisabled()
        }
      })
    })

    describe('WHEN the update succeeds', () => {
      it('THEN should send only the editable fields, toast success and stay on the page', async () => {
        mockUpdate.mockResolvedValue({ data: { updateAgentStorefrontIntegration: { id: 'sf_1' } } })

        const payload = openEditDialog()
        const form = renderDialog(payload)

        act(() => {
          form.setFieldValue('name', 'Agentic Flow B')
        })

        const outcome = await submit(payload)

        expect(outcome.status).toBe('fulfilled')
        expect(mockCreate).not.toHaveBeenCalled()
        expect(mockUpdate).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'sf_1',
              name: 'Agentic Flow B',
              code: 'agentic_flow_a',
              paymentProviderCode: 'stripe_1',
              resourceEndpoint: 'https://api.acme.example/count',
              resourceInstructions: '',
            },
          },
        })
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(testMockNavigateFn).not.toHaveBeenCalled()
        expect(payload.form.didSubmitSucceed?.()).toBe(true)
      })
    })

    describe('WHEN the API refuses the payment connection change', () => {
      it('THEN should keep the dialog open with an error on the payment connection', async () => {
        mockUpdate.mockResolvedValue({
          data: { updateAgentStorefrontIntegration: null },
          errors: buildErrors({
            paymentProviderCode: [LagoApiError.AgentStorefrontHasEnrolledAgents],
          }),
        })

        const payload = openEditDialog()
        const form = renderDialog(payload)

        const outcome = await submit(payload)

        expect(outcome.status).toBe('rejected')
        expect(addToast).not.toHaveBeenCalled()
        expect(payload.form.didSubmitSucceed?.()).toBe(false)
        expect(form.getFieldMeta('paymentProviderCode')?.errors.length).toBeGreaterThan(0)
      })
    })

    describe('WHEN the update fails on the network', () => {
      it('THEN should reject with the network error and leave the toast to onError', async () => {
        const networkError = new Error('Network error')

        mockUpdate.mockRejectedValue(networkError)

        const payload = openEditDialog()

        renderDialog(payload)

        const outcome = await submit(payload)

        expect(outcome).toEqual({ status: 'rejected', reason: networkError })
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })
})
