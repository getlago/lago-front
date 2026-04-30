import { screen } from '@testing-library/react'

import { OrderTypeEnum, QuoteDetailItemFragment, StatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import EditQuoteAside, {
  EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID,
  EDIT_QUOTE_ASIDE_OWNERS_COMBOBOX_TEST_ID,
  EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID,
  EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID,
} from '../EditQuoteAside'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockUpdateQuote = jest.fn()

jest.mock('../../hooks/useUpdateQuote', () => ({
  useUpdateQuote: () => ({
    updateQuote: mockUpdateQuote,
    isUpdatingQuote: false,
  }),
}))

let mockMembersQueryData: unknown = undefined

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetMembersForCreateQuoteQuery: () => ({
    data: mockMembersQueryData,
    loading: false,
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
  },
  owners: [{ __typename: 'User', id: 'user-1', email: 'alice@example.com' }],
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
    mockMembersQueryData = {
      memberships: {
        collection: [
          { id: 'member-1', user: { id: 'user-1', email: 'alice@example.com' } },
          { id: 'member-2', user: { id: 'user-2', email: 'bob@example.com' } },
        ],
      },
    }
  })

  describe('GIVEN a quote is provided', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the quote type field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(
          screen.getByTestId(EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN should render the owners combobox', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(
          screen.getByTestId(EDIT_QUOTE_ASIDE_OWNERS_COMBOBOX_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN should render the customer field', () => {
        render(<EditQuoteAside quote={mockQuote} />)

        expect(
          screen.getByTestId(EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID),
        ).toBeInTheDocument()
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
          },
        }

        render(<EditQuoteAside quote={quoteWithSubscription} />)

        expect(
          screen.getByTestId(EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID),
        ).toBeInTheDocument()
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
          screen.queryByTestId(EDIT_QUOTE_ASIDE_OWNERS_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
