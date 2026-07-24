import { act, renderHook } from '@testing-library/react'

import {
  CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum,
  CustomerSubscriptionInvoiceIssuingDateAnchorEnum,
  EditCustomerIssuingDatePolicyDialogFragment,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  EDIT_CUSTOMER_ISSUING_DATE_POLICY_FORM_ID,
  useEditCustomerIssuingDatePolicyDialog,
} from '../EditCustomerIssuingDatePolicyDialog'

const mockFormDialogOpen = jest.fn()
const mockUpdateIssuingDatePolicy = jest.fn()
const mockAddToast = jest.fn()

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({
    open: mockFormDialogOpen,
    close: jest.fn(),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (args: unknown) => mockAddToast(args),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useUpdateCustomerIssuingDatePolicyMutation: (options?: {
      onCompleted?: (data: unknown) => void
    }) => [
      async (variables: unknown) => {
        const result = await mockUpdateIssuingDatePolicy(variables)

        if (result?.data) {
          options?.onCompleted?.(result.data)
        }

        return result
      },
    ],
  }
})

const CUSTOMER_ID = 'customer-1'
const CUSTOMER_EXTERNAL_ID = 'external-1'

const buildCustomer = (
  billingConfiguration: {
    subscriptionInvoiceIssuingDateAnchor?: CustomerSubscriptionInvoiceIssuingDateAnchorEnum | null
    subscriptionInvoiceIssuingDateAdjustment?: CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum | null
  } | null = null,
) =>
  ({
    __typename: 'Customer' as const,
    id: CUSTOMER_ID,
    externalId: CUSTOMER_EXTERNAL_ID,
    invoiceGracePeriod: 0,
    billingConfiguration: billingConfiguration
      ? { __typename: 'CustomerBillingConfiguration' as const, ...billingConfiguration }
      : null,
  }) as EditCustomerIssuingDatePolicyDialogFragment

const buildResult = (billingConfiguration: {
  subscriptionInvoiceIssuingDateAnchor: CustomerSubscriptionInvoiceIssuingDateAnchorEnum | null
  subscriptionInvoiceIssuingDateAdjustment: CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum | null
}) => ({
  data: {
    updateCustomer: {
      __typename: 'Customer',
      id: CUSTOMER_ID,
      externalId: CUSTOMER_EXTERNAL_ID,
      invoiceGracePeriod: 0,
      billingConfiguration: {
        __typename: 'CustomerBillingConfiguration',
        ...billingConfiguration,
      },
    },
  },
  errors: undefined,
})

const customWrapper = ({ children }: { children: React.ReactNode }) => AllTheProviders({ children })

const openDialog = (customer: ReturnType<typeof buildCustomer> = buildCustomer()) => {
  const { result } = renderHook(() => useEditCustomerIssuingDatePolicyDialog(), {
    wrapper: customWrapper,
  })

  act(() => {
    result.current.openEditCustomerIssuingDatePolicyDialog({ customer })
  })

  return mockFormDialogOpen.mock.calls.at(-1)?.[0]
}

describe('useEditCustomerIssuingDatePolicyDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Keep the dialog promise pending so the close-branch (which resets the
    // form and clears the data ref) does not fire before we invoke submit.
    mockFormDialogOpen.mockReturnValue(new Promise(() => {}))
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN rendered', () => {
      it('THEN should return openEditCustomerIssuingDatePolicyDialog function', () => {
        const { result } = renderHook(() => useEditCustomerIssuingDatePolicyDialog(), {
          wrapper: customWrapper,
        })

        expect(typeof result.current.openEditCustomerIssuingDatePolicyDialog).toBe('function')
      })
    })
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should call formDialog.open once', () => {
        openDialog()

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
      })

      it('THEN should include closeOnError false', () => {
        openDialog()

        expect(mockFormDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ closeOnError: false }),
        )
      })

      it('THEN should pass the expected form id', () => {
        openDialog()

        expect(mockFormDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            form: expect.objectContaining({ id: EDIT_CUSTOMER_ISSUING_DATE_POLICY_FORM_ID }),
          }),
        )
      })
    })
  })

  describe('GIVEN the form submit', () => {
    describe('WHEN the customer has explicit values', () => {
      it('THEN should call the mutation with id, externalId and the selected enums', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(
          buildResult({
            subscriptionInvoiceIssuingDateAnchor:
              CustomerSubscriptionInvoiceIssuingDateAnchorEnum.CurrentPeriodEnd,
            subscriptionInvoiceIssuingDateAdjustment:
              CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
          }),
        )

        const openArgs = openDialog(
          buildCustomer({
            subscriptionInvoiceIssuingDateAnchor:
              CustomerSubscriptionInvoiceIssuingDateAnchorEnum.CurrentPeriodEnd,
            subscriptionInvoiceIssuingDateAdjustment:
              CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
          }),
        )

        await act(async () => {
          await openArgs.form.submit()
        })

        expect(mockUpdateIssuingDatePolicy).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                id: CUSTOMER_ID,
                externalId: CUSTOMER_EXTERNAL_ID,
                billingConfiguration: expect.objectContaining({
                  subscriptionInvoiceIssuingDateAnchor:
                    CustomerSubscriptionInvoiceIssuingDateAnchorEnum.CurrentPeriodEnd,
                  subscriptionInvoiceIssuingDateAdjustment:
                    CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
                }),
              }),
            }),
          }),
        )
      })
    })

    describe('WHEN the customer has no values', () => {
      it('THEN should submit null for both fields', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(
          buildResult({
            subscriptionInvoiceIssuingDateAnchor: null,
            subscriptionInvoiceIssuingDateAdjustment: null,
          }),
        )

        const openArgs = openDialog(buildCustomer(null))

        await act(async () => {
          await openArgs.form.submit()
        })

        expect(mockUpdateIssuingDatePolicy).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                billingConfiguration: {
                  subscriptionInvoiceIssuingDateAnchor: null,
                  subscriptionInvoiceIssuingDateAdjustment: null,
                },
              }),
            }),
          }),
        )
      })
    })

    describe('WHEN the mutation completes', () => {
      it('THEN should show a success toast', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(
          buildResult({
            subscriptionInvoiceIssuingDateAnchor:
              CustomerSubscriptionInvoiceIssuingDateAnchorEnum.NextPeriodStart,
            subscriptionInvoiceIssuingDateAdjustment:
              CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum.AlignWithFinalizationDate,
          }),
        )

        const openArgs = openDialog()

        await act(async () => {
          await openArgs.form.submit()
        })

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })

      it('THEN should use a distinct toast key for clearing vs updating both fields', async () => {
        const getToastKey = async (result: ReturnType<typeof buildResult>): Promise<string> => {
          mockUpdateIssuingDatePolicy.mockResolvedValueOnce(result)

          const openArgs = openDialog()

          await act(async () => {
            await openArgs.form.submit()
          })

          return (mockAddToast.mock.calls.at(-1)?.[0] as { translateKey: string }).translateKey
        }

        const updateKey = await getToastKey(
          buildResult({
            subscriptionInvoiceIssuingDateAnchor:
              CustomerSubscriptionInvoiceIssuingDateAnchorEnum.NextPeriodStart,
            subscriptionInvoiceIssuingDateAdjustment:
              CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum.AlignWithFinalizationDate,
          }),
        )

        const clearKey = await getToastKey(
          buildResult({
            subscriptionInvoiceIssuingDateAnchor: null,
            subscriptionInvoiceIssuingDateAdjustment: null,
          }),
        )

        expect(clearKey).not.toEqual(updateKey)
      })
    })

    describe('WHEN the mutation does not complete', () => {
      it('THEN should throw so the dialog stays open', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce({ data: undefined, errors: [{}] })

        const openArgs = openDialog()

        await act(async () => {
          await expect(openArgs.form.submit()).rejects.toThrow()
        })

        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a field is cleared', () => {
      it('THEN should still submit and send null for the cleared field', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(
          buildResult({
            subscriptionInvoiceIssuingDateAnchor: null,
            subscriptionInvoiceIssuingDateAdjustment:
              CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
          }),
        )

        const openArgs = openDialog(
          buildCustomer({
            subscriptionInvoiceIssuingDateAnchor:
              CustomerSubscriptionInvoiceIssuingDateAnchorEnum.CurrentPeriodEnd,
            subscriptionInvoiceIssuingDateAdjustment:
              CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
          }),
        )
        const { form } = openArgs.children.props

        act(() => {
          form.setFieldValue('subscriptionInvoiceIssuingDateAnchor', undefined)
        })

        await act(async () => {
          await openArgs.form.submit()
        })

        expect(mockUpdateIssuingDatePolicy).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                billingConfiguration: expect.objectContaining({
                  subscriptionInvoiceIssuingDateAnchor: null,
                  subscriptionInvoiceIssuingDateAdjustment:
                    CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
                }),
              }),
            }),
          }),
        )
      })
    })
  })
})
