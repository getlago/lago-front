import { screen } from '@testing-library/react'

import { PaymentTermTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { QUOTE_PAYMENT_TERM_LINE_TEST_ID, QuotePaymentTermLine } from '../QuotePaymentTermLine'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('QuotePaymentTermLine', () => {
  describe('GIVEN a resolved payment term', () => {
    describe('WHEN the row renders', () => {
      it('THEN should display the formatted value', () => {
        render(
          <QuotePaymentTermLine paymentTerm={{ termType: PaymentTermTypeEnum.Net, days: 30 }} />,
        )

        const value = screen.getByTestId(QUOTE_PAYMENT_TERM_LINE_TEST_ID)

        expect(value).toBeInTheDocument()
        expect(value).not.toHaveTextContent('-')
      })
    })
  })

  describe('GIVEN a term type carrying no numeric field', () => {
    describe('WHEN the row renders', () => {
      it('THEN should still display a value rather than the placeholder', () => {
        render(<QuotePaymentTermLine paymentTerm={{ termType: PaymentTermTypeEnum.EndOfMonth }} />)

        expect(screen.getByTestId(QUOTE_PAYMENT_TERM_LINE_TEST_ID)).not.toHaveTextContent('-')
      })
    })
  })

  describe('GIVEN no payment term', () => {
    describe.each([
      ['undefined', undefined],
      ['null', null],
    ])('WHEN the value is %s', (_, paymentTerm) => {
      it('THEN should display the placeholder rather than hiding the row', () => {
        render(<QuotePaymentTermLine paymentTerm={paymentTerm} />)

        expect(screen.getByTestId(QUOTE_PAYMENT_TERM_LINE_TEST_ID)).toHaveTextContent('-')
      })
    })
  })

  describe('GIVEN the row is read-only', () => {
    describe('WHEN it renders', () => {
      it('THEN should render no editable control', () => {
        const { container } = render(
          <QuotePaymentTermLine paymentTerm={{ termType: PaymentTermTypeEnum.Net, days: 30 }} />,
        )

        expect(container.querySelector('input')).toBeNull()
        expect(container.querySelector('button')).toBeNull()
      })
    })
  })
})
