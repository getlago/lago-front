import { act, renderHook } from '@testing-library/react'

import {
  BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum,
  BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum,
  EditBillingEntityInvoiceIssuingDatePolicyDialogFragment,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  EDIT_BILLING_ENTITY_INVOICE_ISSUING_DATE_POLICY_FORM_ID,
  useEditBillingEntityInvoiceIssuingDatePolicyDialog,
} from '../EditBillingEntityInvoiceIssuingDatePolicyDialog'

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
    useUpdateBillingEntityInvoiceIssuingDatePolicyMutation: (options?: {
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

const BILLING_ENTITY_ID = 'billing-entity-1'

const buildBillingEntity = (
  billingConfiguration: {
    invoiceGracePeriod?: number | null
    subscriptionInvoiceIssuingDateAnchor?: BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum | null
    subscriptionInvoiceIssuingDateAdjustment?: BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum | null
  } | null = {},
) =>
  ({
    __typename: 'BillingEntity' as const,
    id: BILLING_ENTITY_ID,
    billingConfiguration: billingConfiguration
      ? { __typename: 'BillingEntityBillingConfiguration' as const, ...billingConfiguration }
      : null,
  }) as EditBillingEntityInvoiceIssuingDatePolicyDialogFragment

const buildSuccessResult = () => ({
  data: {
    updateBillingEntity: {
      __typename: 'BillingEntity',
      id: BILLING_ENTITY_ID,
      billingConfiguration: {
        __typename: 'BillingEntityBillingConfiguration',
        invoiceGracePeriod: 0,
        subscriptionInvoiceIssuingDateAnchor:
          BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum.NextPeriodStart,
        subscriptionInvoiceIssuingDateAdjustment:
          BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum.AlignWithFinalizationDate,
      },
    },
  },
  errors: undefined,
})

const customWrapper = ({ children }: { children: React.ReactNode }) => AllTheProviders({ children })

const openDialog = (
  billingEntity: ReturnType<typeof buildBillingEntity> = buildBillingEntity(),
) => {
  const { result } = renderHook(() => useEditBillingEntityInvoiceIssuingDatePolicyDialog(), {
    wrapper: customWrapper,
  })

  act(() => {
    result.current.openEditBillingEntityInvoiceIssuingDatePolicyDialog({ billingEntity })
  })

  return mockFormDialogOpen.mock.calls.at(-1)?.[0]
}

describe('useEditBillingEntityInvoiceIssuingDatePolicyDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Keep the dialog promise pending so the close-branch (which resets the
    // form and clears the data ref) does not fire before we invoke submit.
    mockFormDialogOpen.mockReturnValue(new Promise(() => {}))
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN rendered', () => {
      it('THEN should return openEditBillingEntityInvoiceIssuingDatePolicyDialog function', () => {
        const { result } = renderHook(() => useEditBillingEntityInvoiceIssuingDatePolicyDialog(), {
          wrapper: customWrapper,
        })

        expect(typeof result.current.openEditBillingEntityInvoiceIssuingDatePolicyDialog).toBe(
          'function',
        )
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
            form: expect.objectContaining({
              id: EDIT_BILLING_ENTITY_INVOICE_ISSUING_DATE_POLICY_FORM_ID,
            }),
          }),
        )
      })
    })
  })

  describe('GIVEN the form submit', () => {
    describe('WHEN the entity has explicit values', () => {
      it('THEN should call the mutation with the selected enums', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(buildSuccessResult())

        const openArgs = openDialog(
          buildBillingEntity({
            invoiceGracePeriod: 3,
            subscriptionInvoiceIssuingDateAnchor:
              BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum.CurrentPeriodEnd,
            subscriptionInvoiceIssuingDateAdjustment:
              BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
          }),
        )

        await act(async () => {
          await openArgs.form.submit()
        })

        expect(mockUpdateIssuingDatePolicy).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                id: BILLING_ENTITY_ID,
                billingConfiguration: expect.objectContaining({
                  subscriptionInvoiceIssuingDateAnchor:
                    BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum.CurrentPeriodEnd,
                  subscriptionInvoiceIssuingDateAdjustment:
                    BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
                }),
              }),
            }),
          }),
        )
      })
    })

    describe('WHEN the entity has no values', () => {
      it('THEN should fall back to the default enums', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(buildSuccessResult())

        const openArgs = openDialog(buildBillingEntity(null))

        await act(async () => {
          await openArgs.form.submit()
        })

        expect(mockUpdateIssuingDatePolicy).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                billingConfiguration: expect.objectContaining({
                  subscriptionInvoiceIssuingDateAnchor:
                    BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum.NextPeriodStart,
                  subscriptionInvoiceIssuingDateAdjustment:
                    BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum.AlignWithFinalizationDate,
                }),
              }),
            }),
          }),
        )
      })
    })

    describe('WHEN the mutation completes', () => {
      it('THEN should show a success toast', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(buildSuccessResult())

        const openArgs = openDialog()

        await act(async () => {
          await openArgs.form.submit()
        })

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })

      it('THEN should resolve the submit with a success reason', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(buildSuccessResult())

        const openArgs = openDialog()

        let dialogResult: unknown

        await act(async () => {
          dialogResult = await openArgs.form.submit()
        })

        expect(dialogResult).toEqual({ reason: 'success' })
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
      it('THEN should still submit and fall back to the default enum for the cleared field', async () => {
        mockUpdateIssuingDatePolicy.mockResolvedValueOnce(buildSuccessResult())

        const openArgs = openDialog(
          buildBillingEntity({
            subscriptionInvoiceIssuingDateAnchor:
              BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum.CurrentPeriodEnd,
            subscriptionInvoiceIssuingDateAdjustment:
              BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
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
                  subscriptionInvoiceIssuingDateAnchor:
                    BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum.NextPeriodStart,
                  subscriptionInvoiceIssuingDateAdjustment:
                    BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum.KeepAnchor,
                }),
              }),
            }),
          }),
        )
      })
    })
  })
})
