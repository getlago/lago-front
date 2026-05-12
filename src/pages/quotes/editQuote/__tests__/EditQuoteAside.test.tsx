import { screen } from '@testing-library/react'

import { OrderTypeEnum, QuoteDetailItemFragment, StatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import EditQuoteAside, {
  EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID,
  EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID,
  EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID,
  EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID,
} from '../EditQuoteAside'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
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
    billingEntity: {
      __typename: 'BillingEntity',
      id: 'be-1',
      code: 'default',
      name: 'Default Entity',
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
})
