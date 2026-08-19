import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import {
  formatNetPaymentTerm,
  QUOTE_PAYMENT_TERM_LINE_TEST_ID,
  QuotePaymentTermLine,
} from '../QuotePaymentTermLine'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// Mirrors the mocked identity `translate`, plus the interpolation the plural key relies on.
const translate = jest.fn(
  (key: string, data?: Record<string, unknown>) =>
    `${key}${data ? `:${JSON.stringify(data)}` : ''}`,
)

describe('formatNetPaymentTerm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no payment term is known', () => {
    describe.each([
      ['undefined', undefined],
      ['null', null],
    ])('WHEN the value is %s', (_, value) => {
      it('THEN should return a placeholder without translating', () => {
        expect(formatNetPaymentTerm(value, translate)).toBe('-')
        expect(translate).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the payment term is zero', () => {
    describe('WHEN formatting it', () => {
      it('THEN should use the dedicated at-issuing-date copy', () => {
        const result = formatNetPaymentTerm(0, translate)

        expect(translate).toHaveBeenCalledTimes(1)
        expect(result).not.toContain('{')
      })
    })
  })

  describe('GIVEN a positive payment term', () => {
    describe.each([
      ['a single day', 1],
      ['several days', 30],
    ])('WHEN formatting %s', (_, days) => {
      it('THEN should interpolate the day count and pass it as the plural driver', () => {
        formatNetPaymentTerm(days, translate)

        expect(translate).toHaveBeenCalledWith(expect.any(String), { days }, days)
      })
    })
  })
})

describe('QuotePaymentTermLine', () => {
  describe('GIVEN a resolved payment term', () => {
    describe('WHEN the row renders', () => {
      it('THEN should display the formatted value', () => {
        render(<QuotePaymentTermLine netPaymentTerm={30} />)

        const value = screen.getByTestId(QUOTE_PAYMENT_TERM_LINE_TEST_ID)

        expect(value).toBeInTheDocument()
        expect(value).not.toHaveTextContent('-')
      })
    })
  })

  describe('GIVEN no payment term', () => {
    describe('WHEN the row renders', () => {
      it('THEN should display the placeholder rather than hiding the row', () => {
        render(<QuotePaymentTermLine />)

        expect(screen.getByTestId(QUOTE_PAYMENT_TERM_LINE_TEST_ID)).toHaveTextContent('-')
      })
    })
  })

  describe('GIVEN the row is read-only', () => {
    describe('WHEN it renders', () => {
      it('THEN should render no editable control', () => {
        const { container } = render(<QuotePaymentTermLine netPaymentTerm={30} />)

        expect(container.querySelector('input')).toBeNull()
        expect(container.querySelector('button')).toBeNull()
      })
    })
  })
})
