import { revalidateLogic } from '@tanstack/react-form'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  CustomerRequestOverduePaymentForm,
  requestOverduePaymentDefaultValues,
  requestOverduePaymentValidationSchema,
} from '~/pages/CustomerRequestOverduePayment/validationSchema'
import { render } from '~/test-utils'

import { RequestPaymentForm } from '../RequestPaymentForm'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/paymentMethodSelection/PaymentMethodComboBox', () => ({
  PaymentMethodComboBox: ({
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  }: {
    selectedPaymentMethod?: { paymentMethodId?: string | null } | null
    setSelectedPaymentMethod: (value: {
      paymentMethodId: string
      paymentMethodType: string
    }) => void
  }) => (
    <div>
      <span data-test="selected-payment-method">
        {selectedPaymentMethod?.paymentMethodId || 'none'}
      </span>
      <button
        type="button"
        data-test="select-payment-method"
        onClick={() =>
          setSelectedPaymentMethod({ paymentMethodId: 'pm_123', paymentMethodType: 'provider' })
        }
      >
        select
      </button>
    </div>
  ),
}))

const SUBMIT_TEST_ID = 'submit'

const TestWrapper = ({
  initialValues = requestOverduePaymentDefaultValues,
  onSubmit,
}: {
  initialValues?: CustomerRequestOverduePaymentForm
  onSubmit: (values: CustomerRequestOverduePaymentForm) => void
}) => {
  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: requestOverduePaymentValidationSchema },
    onSubmit: async ({ value }) => onSubmit(value),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <RequestPaymentForm
        form={form}
        invoicesLoading={false}
        overdueAmount={100}
        currency={CurrencyEnum.Usd}
        invoices={[]}
      />
      <form.AppForm>
        <form.SubmitButton dataTest={SUBMIT_TEST_ID}>submit</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}

describe('RequestPaymentForm', () => {
  describe('GIVEN the recipient field is filled with an uppercase email', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should submit the lowercased email', async () => {
        const user = userEvent.setup()
        const onSubmit = jest.fn()

        render(<TestWrapper onSubmit={onSubmit} />)

        await user.type(screen.getByRole('textbox'), 'Billing@ACME.com')
        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ emails: 'billing@acme.com' }),
          )
        })
      })
    })
  })

  describe('GIVEN the recipient field is focused', () => {
    describe('WHEN Enter is pressed', () => {
      it('THEN should submit the form', async () => {
        const user = userEvent.setup()
        const onSubmit = jest.fn()

        render(<TestWrapper onSubmit={onSubmit} />)

        await user.type(screen.getByRole('textbox'), 'billing@acme.com{enter}')

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ emails: 'billing@acme.com' }),
          )
        })
      })
    })
  })

  describe('GIVEN a payment method is picked', () => {
    describe('WHEN the form is submitted', () => {
      // BIL-410: the combobox is driven manually, so a shape mismatch between
      // what it publishes and what the schema accepts would silently keep the
      // submit button disabled instead of sending the selection.
      it('THEN should submit the selected payment method', async () => {
        const user = userEvent.setup()
        const onSubmit = jest.fn()

        render(
          <TestWrapper
            initialValues={{ ...requestOverduePaymentDefaultValues, emails: 'billing@acme.com' }}
            onSubmit={onSubmit}
          />,
        )

        await user.click(screen.getByTestId('select-payment-method'))

        expect(screen.getByTestId('selected-payment-method')).toHaveTextContent('pm_123')

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              paymentMethod: { paymentMethodId: 'pm_123', paymentMethodType: 'provider' },
            }),
          )
        })
      })
    })
  })

  describe('GIVEN the recipient field is empty', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should show the required error and not submit', async () => {
        const user = userEvent.setup()
        const onSubmit = jest.fn()

        render(<TestWrapper onSubmit={onSubmit} />)

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByText('text_620bc4d4269a55014d493f3d')).toBeInTheDocument()
        })

        expect(onSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the recipient field holds one invalid email among valid ones', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should show the invalid-emails error and not submit', async () => {
        const user = userEvent.setup()
        const onSubmit = jest.fn()

        render(<TestWrapper onSubmit={onSubmit} />)

        await user.type(screen.getByRole('textbox'), 'billing@acme.com,nope')
        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByText('text_66b258f62100490d0eb5ca8b')).toBeInTheDocument()
        })

        expect(onSubmit).not.toHaveBeenCalled()
      })
    })
  })
})
