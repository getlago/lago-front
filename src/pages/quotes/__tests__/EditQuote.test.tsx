import { screen, waitFor } from '@testing-library/react'
import { act } from 'react'

import { render } from '~/test-utils'

import EditQuote from '../EditQuote'

// --- Mocks ---

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/designSystem/RichTextEditor/RichTextEditor', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')

  const MockRichTextEditor = ({
    getMarkdownRef,
  }: {
    getMarkdownRef?: React.MutableRefObject<(() => string) | null>
  }) => {
    React.useEffect(() => {
      if (getMarkdownRef) {
        getMarkdownRef.current = () => '# Mock markdown content'
      }

      return () => {
        if (getMarkdownRef) {
          getMarkdownRef.current = null
        }
      }
    }, [getMarkdownRef])

    return <div data-test="mock-rich-text-editor" />
  }

  return {
    __esModule: true,
    default: MockRichTextEditor,
  }
})

jest.mock('../editQuote/EditQuoteAside', () => {
  return {
    __esModule: true,
    default: () => <div data-test="mock-edit-quote-aside" />,
  }
})

const mockUpdateQuoteVersion = jest.fn().mockResolvedValue({})
const mockUpdateQuote = jest.fn().mockResolvedValue({})

let mockIsUpdatingQuoteVersion = false
let mockIsUpdatingQuote = false

let capturedOnUpdateFinished: (() => void) | undefined
let capturedOnUpdateError: (() => void) | undefined

jest.mock('../hooks/useUpdateQuote', () => ({
  useUpdateQuote: (opts?: { onUpdateFinished?: () => void; onUpdateError?: () => void }) => {
    capturedOnUpdateFinished = opts?.onUpdateFinished
    capturedOnUpdateError = opts?.onUpdateError

    return {
      updateQuoteVersion: mockUpdateQuoteVersion,
      isUpdatingQuoteVersion: mockIsUpdatingQuoteVersion,
      isUpdatingQuote: mockIsUpdatingQuote,
      updateQuote: mockUpdateQuote,
    }
  },
}))

const mockQuote = {
  __typename: 'Quote' as const,
  id: 'quote-1',
  number: 'Q-001',
  orderType: 'subscription_creation',
  createdAt: '2026-01-01',
  versions: [
    {
      __typename: 'QuoteVersion' as const,
      id: 'version-1',
      status: 'draft',
      version: 1,
      createdAt: '2026-01-01',
    },
  ],
  customer: {
    __typename: 'Customer' as const,
    id: 'customer-1',
    name: 'Acme Corp',
    externalId: 'ext-cust-1',
  },
  owners: [{ __typename: 'User' as const, id: 'user-1', email: 'alice@example.com' }],
  subscription: null,
  currentVersion: {
    __typename: 'QuoteVersion' as const,
    id: 'version-1',
    status: 'draft',
    version: 1,
    content: 'Some content',
    currency: null,
    startDate: null,
    endDate: null,
    createdAt: '2026-01-01',
  },
}

const mockUseQuote = jest.fn()

jest.mock('../hooks/useQuote', () => ({
  useQuote: (...args: unknown[]) => mockUseQuote(...args),
}))

jest.mock('../common/getQuoteStatusMapping', () => ({
  getQuoteStatusMapping: () => ({ type: 'outline', label: 'draft' }),
}))

// --- Tests ---

describe('EditQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockIsUpdatingQuoteVersion = false
    mockIsUpdatingQuote = false

    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ quoteId: 'quote-123' })
    mockUseQuote.mockReturnValue({ quote: mockQuote, loading: false })
  })

  describe('GIVEN the quote is loading', () => {
    describe('WHEN rendered', () => {
      it('THEN should not display quote number', () => {
        mockUseQuote.mockReturnValue({ quote: null, loading: true })

        render(<EditQuote />)

        expect(screen.queryByText('Q-001 - v1')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the quote is loaded', () => {
    describe('WHEN rendered', () => {
      it('THEN should display quote number and version', () => {
        render(<EditQuote />)

        expect(screen.getByText('Q-001 - v1')).toBeInTheDocument()
      })
    })

    describe('WHEN rendered in idle state', () => {
      it('THEN should display the Saved status chip', () => {
        render(<EditQuote />)

        expect(screen.getByText('text_1779268404389wpd2ysgatw4')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the save encounters an error', () => {
    describe('WHEN onUpdateError is triggered', () => {
      it('THEN should display the error status chip and a retry button', async () => {
        render(<EditQuote />)

        const buttonsBeforeError = screen.getAllByTestId('button').length

        act(() => {
          capturedOnUpdateError?.()
        })

        await waitFor(() => {
          expect(screen.getByText('text_1779437694622y666yr137gm')).toBeInTheDocument()
        })

        // The retry icon button should now be present (one more button than before)
        const buttonsAfterError = screen.getAllByTestId('button').length

        expect(buttonsAfterError).toBe(buttonsBeforeError + 1)
      })
    })

    describe('WHEN the retry button is clicked without a stored payload', () => {
      it('THEN should remain in error state since no payload is available', async () => {
        render(<EditQuote />)

        const initialButtons = screen.getAllByTestId('button')

        act(() => {
          capturedOnUpdateError?.()
        })

        await waitFor(() => {
          expect(screen.getByText('text_1779437694622y666yr137gm')).toBeInTheDocument()
        })

        // Find the new button that appeared (the retry button)
        const allButtons = screen.getAllByTestId('button')
        const retryButton = allButtons.find((btn) => !initialButtons.includes(btn)) as HTMLElement

        await act(async () => {
          retryButton.click()
        })

        // The retry handler checks failedPayloadRef — with no prior save,
        // it exits early, so the status stays as error
        expect(screen.getByText('text_1779437694622y666yr137gm')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the save succeeds after an error', () => {
    describe('WHEN onUpdateFinished is triggered', () => {
      it('THEN should display the Saved status chip again', async () => {
        render(<EditQuote />)

        act(() => {
          capturedOnUpdateError?.()
        })

        await waitFor(() => {
          expect(screen.getByText('text_1779437694622y666yr137gm')).toBeInTheDocument()
        })

        act(() => {
          capturedOnUpdateFinished?.()
        })

        await waitFor(() => {
          expect(screen.getByText('text_1779268404389wpd2ysgatw4')).toBeInTheDocument()
        })

        expect(screen.queryByText('text_1779437694622y666yr137gm')).not.toBeInTheDocument()
      })
    })
  })
})
