import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { DIALOG_TITLE_TEST_ID, FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import {
  EditBillingEntityPaymentTermForDialogFragment,
  EditCustomerPaymentTermForDialogFragment,
  PaymentTermInput,
  PaymentTermTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  EDIT_PAYMENT_TERM_SUBMIT_BUTTON_TEST_ID,
  useEditPaymentTermDialog,
} from '../EditPaymentTermDialog'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

const mockUpdateCustomer = jest.fn()
const mockUpdateBillingEntity = jest.fn()

let customerCallbacks: { onCompleted?: (data: unknown) => void } = {}
let billingEntityCallbacks: { onCompleted?: (data: unknown) => void } = {}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useUpdateCustomerPaymentTermMutation: (options: typeof customerCallbacks) => {
    customerCallbacks = options
    return [mockUpdateCustomer, { loading: false }]
  },
  useUpdateBillingEntityPaymentTermMutation: (options: typeof billingEntityCallbacks) => {
    billingEntityCallbacks = options
    return [mockUpdateBillingEntity, { loading: false }]
  },
}))

const CUSTOMER_ID = 'customer-1'
const CUSTOMER_EXTERNAL_ID = 'customer-external-1'
const BILLING_ENTITY_ID = 'billing-entity-1'

const term = (
  overrides: Partial<EditCustomerPaymentTermForDialogFragment['paymentTerm']> & {
    termType: PaymentTermTypeEnum
  },
) => ({
  __typename: 'PaymentTerm' as const,
  days: null,
  dayOfMonth: null,
  monthOffset: null,
  ...overrides,
})

const buildCustomer = (
  paymentTerm: EditCustomerPaymentTermForDialogFragment['paymentTerm'] = null,
  billingEntityTerm: EditCustomerPaymentTermForDialogFragment['paymentTerm'] = term({
    termType: PaymentTermTypeEnum.Net,
    days: 30,
  }),
): EditCustomerPaymentTermForDialogFragment => ({
  __typename: 'Customer',
  id: CUSTOMER_ID,
  externalId: CUSTOMER_EXTERNAL_ID,
  name: 'Acme',
  paymentTerm,
  billingEntity: {
    __typename: 'BillingEntity',
    id: BILLING_ENTITY_ID,
    paymentTerm: billingEntityTerm,
  },
})

const buildBillingEntity = (
  paymentTerm: EditBillingEntityPaymentTermForDialogFragment['paymentTerm'] = null,
): EditBillingEntityPaymentTermForDialogFragment => ({
  __typename: 'BillingEntity',
  id: BILLING_ENTITY_ID,
  paymentTerm,
})

type OpenArgs = Parameters<
  ReturnType<typeof useEditPaymentTermDialog>['openEditPaymentTermDialog']
>[0]

function TestComponent({ openArgs }: { openArgs: OpenArgs }): ReactNode {
  const { openEditPaymentTermDialog } = useEditPaymentTermDialog()

  return (
    <button data-test="open-dialog" onClick={() => openEditPaymentTermDialog(openArgs)}>
      Open Dialog
    </button>
  )
}

async function renderAndOpenDialog(openArgs: OpenArgs): Promise<void> {
  await act(() =>
    render(
      <NiceModal.Provider>
        <TestComponent openArgs={openArgs} />
      </NiceModal.Provider>,
    ),
  )

  await act(async () => {
    screen.getByTestId('open-dialog').click()
  })

  await waitFor(() => {
    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
  })
}

const submit = () => userEvent.click(screen.getByTestId(EDIT_PAYMENT_TERM_SUBMIT_BUTTON_TEST_ID))

const resolveCustomerMutation = () =>
  mockUpdateCustomer.mockImplementation(async () => {
    customerCallbacks.onCompleted?.({ updateCustomer: { id: CUSTOMER_ID } })

    return { data: { updateCustomer: { id: CUSTOMER_ID } } }
  })

const resolveBillingEntityMutation = () =>
  mockUpdateBillingEntity.mockImplementation(async () => {
    billingEntityCallbacks.onCompleted?.({ updateBillingEntity: { id: BILLING_ENTITY_ID } })

    return { data: { updateBillingEntity: { id: BILLING_ENTITY_ID } } }
  })

const submittedCustomerTerm = (): PaymentTermInput | null =>
  mockUpdateCustomer.mock.calls[0][0].variables.input.paymentTerm

describe('EditPaymentTermDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    customerCallbacks = {}
    billingEntityCallbacks = {}
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN it renders', () => {
      it('THEN should show the title and the submit button', async () => {
        await renderAndOpenDialog({ model: buildBillingEntity() })

        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(EDIT_PAYMENT_TERM_SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a term type is set', () => {
    // The API validates the term as a discriminated union: each type accepts only its own
    // fields. Anything extra is a validation error, so the payload has to be exact.
    describe.each([
      [PaymentTermTypeEnum.DueOnReceipt, {}, { termType: PaymentTermTypeEnum.DueOnReceipt }],
      [PaymentTermTypeEnum.Net, { days: 30 }, { termType: PaymentTermTypeEnum.Net, days: 30 }],
      [PaymentTermTypeEnum.EndOfMonth, {}, { termType: PaymentTermTypeEnum.EndOfMonth }],
      [
        PaymentTermTypeEnum.NetEndOfMonth,
        { days: 10 },
        { termType: PaymentTermTypeEnum.NetEndOfMonth, days: 10 },
      ],
      [
        PaymentTermTypeEnum.DaysEndOfMonth,
        { days: 10 },
        { termType: PaymentTermTypeEnum.DaysEndOfMonth, days: 10 },
      ],
      [
        PaymentTermTypeEnum.DayOfMonth,
        { dayOfMonth: 15, monthOffset: 2 },
        { termType: PaymentTermTypeEnum.DayOfMonth, dayOfMonth: 15, monthOffset: 2 },
      ],
    ])('WHEN submitting a %s term', (termType, fields, expected) => {
      it('THEN should send only the fields that type accepts', async () => {
        resolveCustomerMutation()

        await renderAndOpenDialog({ model: buildCustomer(term({ termType, ...fields })) })
        await submit()

        await waitFor(() => expect(mockUpdateCustomer).toHaveBeenCalled())

        expect(submittedCustomerTerm()).toEqual(expected)
      })
    })
  })

  describe('GIVEN a customer overriding its billing entity', () => {
    describe('WHEN the override is submitted', () => {
      it('THEN should send the identifiers the update input requires alongside the term', async () => {
        resolveCustomerMutation()

        await renderAndOpenDialog({
          model: buildCustomer(term({ termType: PaymentTermTypeEnum.Net, days: 45 })),
        })
        await submit()

        await waitFor(() => {
          expect(mockUpdateCustomer).toHaveBeenCalledWith({
            variables: {
              input: {
                id: CUSTOMER_ID,
                externalId: CUSTOMER_EXTERNAL_ID,
                name: 'Acme',
                paymentTerm: { termType: PaymentTermTypeEnum.Net, days: 45 },
              },
            },
          })
        })

        expect(mockUpdateBillingEntity).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })
  })

  describe('GIVEN a billing entity', () => {
    describe('WHEN the term is submitted', () => {
      it('THEN should call the billing entity mutation with the term alone', async () => {
        resolveBillingEntityMutation()

        await renderAndOpenDialog({
          model: buildBillingEntity(term({ termType: PaymentTermTypeEnum.EndOfMonth })),
        })
        await submit()

        await waitFor(() => {
          expect(mockUpdateBillingEntity).toHaveBeenCalledWith({
            variables: {
              input: {
                id: BILLING_ENTITY_ID,
                paymentTerm: { termType: PaymentTermTypeEnum.EndOfMonth },
              },
            },
          })
        })

        expect(mockUpdateCustomer).not.toHaveBeenCalled()
      })
    })

    // The billing entity is the last level of the chain, so it can never inherit. An empty
    // term type there is a no-op rather than a clear.
    describe('WHEN no term type is selected', () => {
      it('THEN should submit nothing', async () => {
        resolveBillingEntityMutation()

        await renderAndOpenDialog({ model: buildBillingEntity() })
        await submit()

        expect(mockUpdateBillingEntity).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a customer inheriting from its billing entity', () => {
    describe('WHEN the inherit choice is submitted', () => {
      it('THEN should clear the override and report it as a deletion', async () => {
        resolveCustomerMutation()

        // No term of its own is exactly the state the inherit option submits.
        await renderAndOpenDialog({ model: buildCustomer() })
        await submit()

        await waitFor(() => expect(mockUpdateCustomer).toHaveBeenCalled())

        expect(submittedCustomerTerm()).toBeNull()
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({ translateKey: 'text_1787603382163macepxq32tf' }),
        )
      })
    })
  })
})
