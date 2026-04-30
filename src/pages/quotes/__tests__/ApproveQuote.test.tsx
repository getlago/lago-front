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
  APPROVE_QUOTE_PREVIEW_TEST_ID,
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
  orderType: OrderTypeEnum.SubscriptionCreation,
  createdAt: '2026-04-09T10:00:00Z',
  versions: [
    { id: 'version-123', status: StatusEnum.Draft, version: 2, createdAt: '2026-04-09T10:00:00Z' },
  ],
  currentVersion: {
    id: 'version-123',
    status: StatusEnum.Draft,
    version: 2,
    content: null,
    createdAt: '2026-04-09T10:00:00Z',
  },
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

    useParamsMock.mockReturnValue({ quoteId: 'quote-123', versionId: 'version-123' })

    mockUseQuote.mockReturnValue({
      quote: mockQuote,
      loading: false,
      error: undefined,
    })

    mockUseApproveQuote.mockReturnValue({
      goToApproveQuote: jest.fn(),
      approveQuote: mockApproveQuote.mockResolvedValue({
        data: { approveQuoteVersion: { id: 'version-123', status: StatusEnum.Approved } },
      }),
    })
  })

  describe('GIVEN the page is rendered with a quote', () => {
    describe('WHEN in default state', () => {
      it.each([
        ['alert', APPROVE_QUOTE_ALERT_TEST_ID],
        ['approve button', APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID],
        ['cancel button', APPROVE_QUOTE_CANCEL_BUTTON_TEST_ID],
        ['close button', APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID],
        ['preview section', APPROVE_QUOTE_PREVIEW_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        render(<ApproveQuote />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
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

  describe('GIVEN the quote has content', () => {
    describe('WHEN content is present', () => {
      it('THEN should render the rich text editor preview', () => {
        mockUseQuote.mockReturnValue({
          quote: {
            ...mockQuote,
            currentVersion: { ...mockQuote.currentVersion, content: '<p>Quote content here</p>' },
          },
          loading: false,
          error: undefined,
        })

        render(<ApproveQuote />)

        const preview = screen.getByTestId(APPROVE_QUOTE_PREVIEW_TEST_ID)

        expect(preview).toHaveTextContent('Quote content here')
      })
    })

    describe('WHEN content is null', () => {
      it('THEN should show the no content fallback', () => {
        render(<ApproveQuote />)

        const preview = screen.getByTestId(APPROVE_QUOTE_PREVIEW_TEST_ID)

        expect(preview).toBeInTheDocument()
        expect(preview.querySelector('[data-test="rich-text-editor-preview"]')).toBeNull()
      })
    })
  })

  describe('GIVEN the approve action', () => {
    describe('WHEN the approve button is clicked and approveQuote succeeds', () => {
      it('THEN should call approveQuote, show success toast, and navigate to order forms tab', async () => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockApproveQuote).toHaveBeenCalled()
        })

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-123/order-forms')
      })
    })
  })

  describe('GIVEN the close action', () => {
    it.each([
      ['close button', APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID],
      ['cancel button', APPROVE_QUOTE_CANCEL_BUTTON_TEST_ID],
    ])(
      'WHEN the %s is clicked THEN should call goBack with quote details path',
      async (_, testId) => {
        const user = userEvent.setup()

        render(<ApproveQuote />)

        await user.click(screen.getByTestId(testId))

        expect(mockGoBack).toHaveBeenCalledWith('/quote/quote-123/overview')
      },
    )
  })

  describe('GIVEN the page is loading', () => {
    beforeEach(() => {
      mockUseQuote.mockReturnValue({
        quote: undefined,
        loading: true,
        error: undefined,
      })
    })

    describe('WHEN data is being fetched', () => {
      it('THEN should not display the alert or preview', () => {
        render(<ApproveQuote />)

        expect(screen.queryByTestId(APPROVE_QUOTE_ALERT_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(APPROVE_QUOTE_PREVIEW_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should still display the header close button and footer buttons', () => {
        render(<ApproveQuote />)

        expect(screen.getByTestId(APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(APPROVE_QUOTE_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an error occurred', () => {
    beforeEach(() => {
      mockUseQuote.mockReturnValue({
        quote: undefined,
        loading: false,
        error: new Error('Something went wrong') as never,
      })
    })

    describe('WHEN the error is displayed', () => {
      it('THEN should not show the approve page content', () => {
        render(<ApproveQuote />)

        expect(screen.queryByTestId(APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(APPROVE_QUOTE_ALERT_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should display the error placeholder with a reload button', () => {
        render(<ApproveQuote />)

        expect(screen.getByRole('button')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the quote is null after loading', () => {
    describe('WHEN no quote data is returned', () => {
      it('THEN should render the content area with empty order type value', () => {
        mockUseQuote.mockReturnValue({
          quote: undefined,
          loading: false,
          error: undefined,
        })

        render(<ApproveQuote />)

        expect(screen.getByTestId(APPROVE_QUOTE_ALERT_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(APPROVE_QUOTE_PREVIEW_TEST_ID)).toBeInTheDocument()
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
        approveQuote: mockApproveQuote.mockResolvedValue({
          data: { approveQuoteVersion: null },
        }),
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
