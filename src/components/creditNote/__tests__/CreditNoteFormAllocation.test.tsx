import { revalidateLogic } from '@tanstack/react-form'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  buildCreditNoteSchema,
  CREDIT_NOTE_DEFAULT_VALUES,
} from '~/pages/createCreditNote/validationSchema'
import { AllTheProviders } from '~/test-utils'

import {
  CREDIT_AMOUNT_INPUT_TEST_ID,
  CreditNoteFormAllocation,
  OFFSET_AMOUNT_INPUT_TEST_ID,
  REFUND_AMOUNT_INPUT_TEST_ID,
} from '../CreditNoteFormAllocation'
import { CreditNoteForm, CreditTypeEnum } from '../types'

const SUBMIT_TEST_ID = 'allocation-test-submit'

const DEFAULT_LIMITS = {
  maxCreditableAmount: 100,
  maxRefundableAmount: 100,
  maxOffsettableAmount: 50,
  totalTaxIncluded: 120,
}

type WrapperProps = {
  payBack: CreditNoteForm['payBack']
  totalTaxIncluded?: number
}

const Wrapper = ({ payBack, totalTaxIncluded = DEFAULT_LIMITS.totalTaxIncluded }: WrapperProps) => {
  const limits = { ...DEFAULT_LIMITS, totalTaxIncluded }

  const form = useAppForm({
    defaultValues: { ...CREDIT_NOTE_DEFAULT_VALUES, payBack },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: buildCreditNoteSchema({
        currency: CurrencyEnum.Usd,
        feesPerInvoice: undefined,
        feeForAddOn: undefined,
        feeForCredit: undefined,
        isPrepaidCreditsInvoice: false,
        getAllocationLimits: () => limits,
      }),
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <CreditNoteFormAllocation form={form} currency={CurrencyEnum.Usd} {...limits} />
      <button type="submit" data-test={SUBMIT_TEST_ID}>
        submit
      </button>
    </form>
  )
}

const renderComponent = (props: WrapperProps) =>
  render(<Wrapper {...props} />, { wrapper: AllTheProviders })

describe('CreditNoteFormAllocation', () => {
  describe('GIVEN all payBack types are present', () => {
    it('THEN should render all three allocation inputs', () => {
      renderComponent({
        payBack: [
          { type: CreditTypeEnum.credit, value: 0 },
          { type: CreditTypeEnum.refund, value: 0 },
          { type: CreditTypeEnum.offset, value: 0 },
        ],
      })

      expect(screen.getByTestId(CREDIT_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(REFUND_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(OFFSET_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN only credit type in payBack', () => {
    it('THEN should render only credit input', () => {
      renderComponent({ payBack: [{ type: CreditTypeEnum.credit, value: 0 }] })

      expect(screen.getByTestId(CREDIT_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(REFUND_AMOUNT_INPUT_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(OFFSET_AMOUNT_INPUT_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN credit and refund types in payBack', () => {
    it('THEN should render credit and refund inputs only', () => {
      renderComponent({
        payBack: [
          { type: CreditTypeEnum.credit, value: 0 },
          { type: CreditTypeEnum.refund, value: 0 },
        ],
      })

      expect(screen.getByTestId(CREDIT_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(REFUND_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(OFFSET_AMOUNT_INPUT_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN credit and offset types in payBack', () => {
    it('THEN should render credit and offset inputs only', () => {
      renderComponent({
        payBack: [
          { type: CreditTypeEnum.credit, value: 0 },
          { type: CreditTypeEnum.offset, value: 0 },
        ],
      })

      expect(screen.getByTestId(CREDIT_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(REFUND_AMOUNT_INPUT_TEST_ID)).not.toBeInTheDocument()
      expect(screen.getByTestId(OFFSET_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN allocation summary', () => {
    it('WHEN values are provided THEN should display total, allocated and remaining amounts', () => {
      renderComponent({
        payBack: [
          { type: CreditTypeEnum.credit, value: 50 },
          { type: CreditTypeEnum.refund, value: 30 },
        ],
        totalTaxIncluded: 120,
      })

      // Total: $120, Allocated: $80 (50+30), Remaining: $40
      expect(screen.getByText('$120.00')).toBeInTheDocument()
      expect(screen.getByText('$80.00')).toBeInTheDocument()
      expect(screen.getByText('$40.00')).toBeInTheDocument()
    })

    it('WHEN offset has value THEN should include it in allocation calculation', () => {
      renderComponent({
        payBack: [
          { type: CreditTypeEnum.credit, value: 30 },
          { type: CreditTypeEnum.refund, value: 20 },
          { type: CreditTypeEnum.offset, value: 10 },
        ],
        totalTaxIncluded: 100,
      })

      // Total: $100, Allocated: $60 (30+20+10), Remaining: $40
      expect(screen.getByText('$100.00')).toBeInTheDocument()
      expect(screen.getByText('$60.00')).toBeInTheDocument()
      expect(screen.getByText('$40.00')).toBeInTheDocument()
    })
  })

  describe('GIVEN error alert', () => {
    it('WHEN the allocation does not add up to the total THEN should show the danger alert on submit', async () => {
      const user = userEvent.setup()

      renderComponent({
        payBack: [
          { type: CreditTypeEnum.credit, value: 0 },
          { type: CreditTypeEnum.refund, value: 0 },
        ],
        totalTaxIncluded: 120,
      })

      expect(screen.queryByTestId('alert-type-danger')).not.toBeInTheDocument()

      await user.click(screen.getByTestId(SUBMIT_TEST_ID))

      expect(await screen.findByTestId('alert-type-danger')).toBeInTheDocument()
    })

    it('WHEN the allocation adds up to the total THEN should not show the alert', async () => {
      const user = userEvent.setup()

      renderComponent({
        payBack: [
          { type: CreditTypeEnum.credit, value: 120 },
          { type: CreditTypeEnum.refund, value: 0 },
        ],
        totalTaxIncluded: 120,
      })

      await user.click(screen.getByTestId(SUBMIT_TEST_ID))

      expect(screen.queryByTestId('alert-type-danger')).not.toBeInTheDocument()
    })

    it('WHEN nothing has been submitted THEN should not show the alert', () => {
      renderComponent({
        payBack: [
          { type: CreditTypeEnum.credit, value: 0 },
          { type: CreditTypeEnum.refund, value: 0 },
        ],
      })

      expect(screen.queryByTestId('alert-type-danger')).not.toBeInTheDocument()
    })
  })
})
