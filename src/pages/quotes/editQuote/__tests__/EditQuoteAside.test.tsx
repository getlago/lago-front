import { screen } from '@testing-library/react'

import { OrderTypeEnum, QuoteDetailItemFragment, StatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import EditQuoteAside, {
  EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID,
  EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID,
  EDIT_QUOTE_ASIDE_END_DATE_TEST_ID,
  EDIT_QUOTE_ASIDE_PAYMENT_TERM_TEST_ID,
  EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID,
  EDIT_QUOTE_ASIDE_START_DATE_TEST_ID,
  EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID,
} from '../EditQuoteAside'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, params?: Record<string, unknown>) => {
      if (key === 'text_64c7a89b6c67eb6c98898125') return '0 days (at issuing date)'
      if (key === 'text_64c7a89b6c67eb6c9889815f' && params?.days)
        return `${params.days} day${Number(params.days) !== 1 ? 's' : ''}`

      return key
    },
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
}))

jest.mock('~/pages/quotes/hooks/useUpdateQuote', () => ({
  useUpdateQuote: () => ({
    updateQuoteVersion: jest.fn(),
    isUpdatingQuoteVersion: false,
    updateQuote: jest.fn(),
    isUpdatingQuote: false,
  }),
}))

const mockQuote: QuoteDetailItemFragment = {
  __typename: 'Quote',
  id: 'quote-1',
  number: 'Q-001',
  orderType: OrderTypeEnum.SubscriptionCreation,
  createdAt: '2026-01-01',
  versions: [
    {
      __typename: 'QuoteVersion',
      id: 'version-1',
      status: StatusEnum.Draft,
      version: 1,
      createdAt: '2026-01-01',
    },
  ],
  customer: {
    __typename: 'Customer',
    id: 'customer-1',
    name: 'Acme Corp',
    externalId: 'ext-cust-1',
    netPaymentTerm: 30,
    billingEntity: {
      __typename: 'BillingEntity',
      id: 'be-1',
      code: 'default',
      name: 'Default Entity',
      netPaymentTerm: 60,
    },
  },
  owners: [],
  subscription: null,
  currentVersion: {
    __typename: 'QuoteVersion',
    id: 'version-1',
    status: StatusEnum.Draft,
    version: 1,
    content: 'Some content',
    billingItems: null,
    createdAt: '2026-01-01',
  },
}

describe('EditQuoteAside', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a quote is provided', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the quote type field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the customer field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the billing entity field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(
          screen.getByTestId(EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with no billing entity', () => {
    describe('WHEN the component renders', () => {
      it('THEN should NOT render the billing entity field', () => {
        const quoteWithoutBillingEntity = {
          ...mockQuote,
          customer: { ...mockQuote.customer, billingEntity: null },
        }

        render(<EditQuoteAside quote={quoteWithoutBillingEntity} />)

        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with no subscription', () => {
    describe('WHEN the component renders', () => {
      it('THEN should NOT render the subscription field', () => {
        render(<EditQuoteAside quote={{ ...mockQuote, subscription: null }} />)

        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with a subscription', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the subscription field', () => {
        const quoteWithSubscription = {
          ...mockQuote,
          subscription: {
            __typename: 'Subscription' as const,
            id: 'sub-1',
            name: 'My Subscription',
            externalId: 'ext-sub-1',
            subscriptionAt: '2026-03-15T00:00:00Z',
            plan: {
              __typename: 'Plan' as const,
              id: 'plan-1',
              name: 'Premium Plan',
            },
          },
        }

        render(<EditQuoteAside quote={quoteWithSubscription} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no quote is provided', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not render any fields', () => {
        render(<EditQuoteAside quote={undefined} />)

        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with dates and payment term', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the start date field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_START_DATE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the end date field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_END_DATE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the payment term field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(screen.getByTestId(EDIT_QUOTE_ASIDE_PAYMENT_TERM_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with netPaymentTerm of 0', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display "0 days (at issuing date)"', () => {
        const quoteWithZeroTerm = {
          ...mockQuote,
          customer: { ...mockQuote.customer, netPaymentTerm: 0 },
        }

        render(<EditQuoteAside quote={quoteWithZeroTerm} />)

        expect(screen.getByDisplayValue('0 days (at issuing date)')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a quote with null customer netPaymentTerm', () => {
    describe('WHEN the billing entity has a netPaymentTerm', () => {
      it('THEN should fall back to billing entity netPaymentTerm', () => {
        const quoteWithNullCustomerTerm = {
          ...mockQuote,
          customer: { ...mockQuote.customer, netPaymentTerm: null },
        }

        render(<EditQuoteAside quote={quoteWithNullCustomerTerm} />)

        expect(screen.getByDisplayValue('60 days')).toBeInTheDocument()
      })
    })

    describe('WHEN the billing entity also has no netPaymentTerm', () => {
      it('THEN should display "-"', () => {
        const quoteWithNoTerm = {
          ...mockQuote,
          customer: {
            ...mockQuote.customer,
            netPaymentTerm: null,
            billingEntity: {
              ...mockQuote.customer.billingEntity,
              netPaymentTerm: null,
            },
          },
        }

        render(<EditQuoteAside quote={quoteWithNoTerm} />)

        expect(screen.getByDisplayValue('-')).toBeInTheDocument()
      })
    })
  })
})
