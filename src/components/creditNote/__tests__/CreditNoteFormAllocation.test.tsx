import { render, screen } from '@testing-library/react'

import { createMockFormikProps } from '~/components/creditNote/__tests__/formikProps.factory'
import { CurrencyEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { CREDIT_AMOUNT_INPUT_TEST_ID, REFUND_AMOUNT_INPUT_TEST_ID } from '../CreditNoteActionsLine'
import { CreditNoteFormAllocation } from '../CreditNoteFormAllocation'
import { CreditTypeEnum, PayBackErrorEnum } from '../types'

const defaultProps = {
  formikProps: createMockFormikProps(),
  currency: CurrencyEnum.Usd,
  canRefund: true,
  maxCreditableAmount: 100,
  maxRefundableAmount: 100,
  totalTaxIncluded: 120,
  estimationLoading: false,
}

const renderComponent = (props = {}) => {
  return render(<CreditNoteFormAllocation {...defaultProps} {...props} />, {
    wrapper: AllTheProviders,
  })
}

describe('CreditNoteFormAllocation', () => {
  describe('refund fields', () => {
    it('should always render refund and credit inputs', () => {
      renderComponent({ canRefund: true })

      expect(screen.getByTestId(REFUND_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(CREDIT_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
    })

    it('should render inputs even when canRefund is false', () => {
      renderComponent({ canRefund: false })

      expect(screen.getByTestId(REFUND_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(CREDIT_AMOUNT_INPUT_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('allocation summary', () => {
    it('should display total, allocated and remaining amounts', () => {
      const formikProps = createMockFormikProps({
        values: {
          payBack: [
            { type: CreditTypeEnum.credit, value: 50 },
            { type: CreditTypeEnum.refund, value: 30 },
          ],
        },
      })

      renderComponent({ formikProps, totalTaxIncluded: 120 })

      // Total: $120, Allocated: $80 (50+30), Remaining: $40
      expect(screen.getByText('$120.00')).toBeInTheDocument()
      expect(screen.getByText('$80.00')).toBeInTheDocument()
      expect(screen.getByText('$40.00')).toBeInTheDocument()
    })
  })

  describe('error alert', () => {
    it('should show alert when payBackErrors exists', () => {
      const formikProps = createMockFormikProps({
        errors: {
          payBackErrors: PayBackErrorEnum.maxTotalInvoice,
        },
      })

      renderComponent({ formikProps })

      expect(screen.getByTestId('alert-type-danger')).toBeInTheDocument()
    })

    it('should not show alert when no errors', () => {
      renderComponent()

      expect(screen.queryByTestId('alert-type-danger')).not.toBeInTheDocument()
    })
  })
})
