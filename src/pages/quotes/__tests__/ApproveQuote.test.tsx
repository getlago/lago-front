import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import { OrderTypeEnum, StatusEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import ApproveQuote, {
  APPROVE_QUOTE_ALERT_TEST_ID,
  APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID,
  APPROVE_QUOTE_CANCEL_BUTTON_TEST_ID,
  APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID,
} from '../ApproveQuote'
import { useApproveQuote } from '../hooks/useApproveQuote'
import { useQuote } from '../hooks/useQuote'

const mockGoBack = jest.fn()

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({
    goBack: mockGoBack,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) => {
      if (vars) return `${key}:${JSON.stringify(vars)}`
      return key
    },
  }),
}))

jest.mock('~/components/designSystem/RichTextEditor/RichTextEditor', () => ({
  __esModule: true,
  default: ({ content }: { content?: string }) => (
    <div data-test="rich-text-editor-preview">{content}</div>
  ),
}))

jest.mock('../hooks/useQuote', () => ({
  useQuote: jest.fn(),
}))

const mockApproveQuote = jest.fn()

jest.mock('../hooks/useApproveQuote', () => ({
  useApproveQuote: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockUseQuote = useQuote as jest.MockedFunction<typeof useQuote>
const mockUseApproveQuote = useApproveQuote as jest.MockedFunction<typeof useApproveQuote>

const mockQuote = {
  id: 'quote-123',
  number: 'QT-2026-0042',
  status: StatusEnum.Draft,
  version: 2,
  orderType: OrderTypeEnum.SubscriptionCreation,
  currency: 'EUR',
  createdAt: '2026-04-09T10:00:00Z',
  customer: {
    id: 'customer-001',
    name: 'Acme Corp',
    externalId: 'ext-acme-001',
  },
}

describe('ApproveQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ quoteId: 'quote-123' })

    mockUseQuote.mockReturnValue({
      quote: mockQuote,
      loading: false,
      error: undefined,
    })

    mockUseApproveQuote.mockReturnValue({
      goToApproveQuote: jest.fn(),
      approveQuote: mockApproveQuote.mockReturnValue(true),
    })
  })

  describe('GIVEN the page is rendered with a quote', () => {
    describe('WHEN in default state', () => {
      it('THEN should display the alert', () => {
        render(<ApproveQuote />)

        expect(screen.getByTestId(APPROVE_QUOTE_ALERT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the approve button', () => {
        render(<ApproveQuote />)

        expect(screen.getByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the cancel button', () => {
        render(<ApproveQuote />)

        expect(screen.getByTestId(APPROVE_QUOTE_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the close button', () => {
        render(<ApproveQuote />)

        expect(screen.getByTestId(APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the quote number', () => {
        render(<ApproveQuote />)

        expect(screen.getByText('QT-2026-0042')).toBeInTheDocument()
      })

      it('THEN should display the customer name', () => {
        render(<ApproveQuote />)

        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the approve action', () => {
    describe('WHEN the approve button is clicked and approveQuote succeeds', () => {
      it('THEN should call approveQuote', async () => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockApproveQuote).toHaveBeenCalled()
        })
      })

      it('THEN should show success toast and navigate to order forms tab', async () => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })

        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-123/order-forms')
      })
    })
  })

  describe('GIVEN the close action', () => {
    describe('WHEN the close button is clicked', () => {
      it('THEN should call goBack with quote details path', async () => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID))

        expect(mockGoBack).toHaveBeenCalledWith('/quote/quote-123/overview')
      })
    })

    describe('WHEN the cancel button is clicked', () => {
      it('THEN should call goBack with quote details path', async () => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(APPROVE_QUOTE_CANCEL_BUTTON_TEST_ID))

        expect(mockGoBack).toHaveBeenCalledWith('/quote/quote-123/overview')
      })
    })
  })

  describe('GIVEN the page is loading', () => {
    describe('WHEN data is being fetched', () => {
      it('THEN should not display the alert or approve button', () => {
        mockUseQuote.mockReturnValue({
          quote: undefined,
          loading: true,
          error: undefined,
        })

        render(<ApproveQuote />)

        expect(screen.queryByTestId(APPROVE_QUOTE_ALERT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an error occurred', () => {
    describe('WHEN the error is displayed', () => {
      it('THEN should not show the approve page content', () => {
        mockUseQuote.mockReturnValue({
          quote: undefined,
          loading: false,
          error: new Error('Something went wrong') as never,
        })

        render(<ApproveQuote />)

        expect(screen.queryByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no quoteId param', () => {
    beforeEach(() => {
      const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

      useParamsMock.mockReturnValue({})
    })

    describe('WHEN the approve button is clicked', () => {
      it('THEN should not call approveQuote mutation', async () => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockApproveQuote).not.toHaveBeenCalled()
        })
      })
    })

    describe('WHEN the close button is clicked', () => {
      it('THEN should not call goBack', async () => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID))

        expect(mockGoBack).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN approveQuote returns a falsy value', () => {
    beforeEach(() => {
      mockUseApproveQuote.mockReturnValue({
        goToApproveQuote: jest.fn(),
        approveQuote: mockApproveQuote.mockReturnValue(false),
      })
    })

    describe('WHEN the approve button is clicked', () => {
      it('THEN should not show success toast or navigate', async () => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockApproveQuote).toHaveBeenCalled()
        })

        expect(addToast).not.toHaveBeenCalled()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
