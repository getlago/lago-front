import { screen } from '@testing-library/react'

import { OrderTypeEnum, QuoteDetailItemFragment, StatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import QuoteDetailsActivityLogs, {
  QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID,
} from '../QuoteDetailsActivityLogs'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockQuote: QuoteDetailItemFragment = {
  id: 'quote-001',
  number: 'QT-2026-0042',
  status: StatusEnum.Draft,
  version: 1,
  orderType: OrderTypeEnum.SubscriptionCreation,
  currency: 'EUR',
  createdAt: '2026-04-09T10:00:00Z',
  customer: {
    id: 'customer-001',
    name: 'Acme Corp',
    externalId: 'ext-acme-001',
  },
}

describe('QuoteDetailsActivityLogs', () => {
  describe('GIVEN the component is rendered with a quote', () => {
    it('THEN should render the container', () => {
      render(<QuoteDetailsActivityLogs quote={mockQuote} />)

      expect(screen.getByTestId(QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID)).toBeInTheDocument()
    })

    it('THEN should display the quote id', () => {
      render(<QuoteDetailsActivityLogs quote={mockQuote} />)

      expect(screen.getByText('quote-001')).toBeInTheDocument()
    })

    it('THEN should render content inside the container', () => {
      render(<QuoteDetailsActivityLogs quote={mockQuote} />)

      const container = screen.getByTestId(QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID)

      expect(container.childNodes.length).toBeGreaterThan(1)
    })
  })
})
