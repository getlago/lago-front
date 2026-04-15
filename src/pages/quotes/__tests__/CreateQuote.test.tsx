import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import {
  CREATE_QUOTE_CUSTOMER_COMBOBOX_TEST_ID,
  CREATE_QUOTE_ORDER_TYPE_TEST_ID,
  CREATE_QUOTE_SUBMIT_BUTTON_TEST_ID,
  CREATE_QUOTE_SUBSCRIPTION_COMBOBOX_TEST_ID,
} from '../CreateQuote'
import CreateQuote from '../CreateQuote'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('../hooks/useCreateQuote', () => ({
  useCreateQuote: () => ({
    loading: false,
    onSave: jest.fn(),
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomersForCreateQuoteLazyQuery: () => [jest.fn(), { data: undefined, loading: false }],
  useGetCustomerSubscriptionsForCreateQuoteLazyQuery: () => [
    jest.fn(),
    { data: undefined, loading: false },
  ],
}))

describe('CreateQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the customer combobox', () => {
        render(<CreateQuote />)

        expect(screen.getByTestId(CREATE_QUOTE_CUSTOMER_COMBOBOX_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the order type selector', () => {
        render(<CreateQuote />)

        expect(screen.getByTestId(CREATE_QUOTE_ORDER_TYPE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the submit button', () => {
        render(<CreateQuote />)

        expect(screen.getByTestId(CREATE_QUOTE_SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not show the subscription combobox by default', () => {
        render(<CreateQuote />)

        expect(
          screen.queryByTestId(CREATE_QUOTE_SUBSCRIPTION_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
