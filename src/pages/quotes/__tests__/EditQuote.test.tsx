import { screen } from '@testing-library/react'

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

jest.mock('../hooks/useUpdateQuote', () => ({
  useUpdateQuote: () => ({
    updateQuoteVersion: mockUpdateQuoteVersion,
    isUpdatingQuoteVersion: mockIsUpdatingQuoteVersion,
    isUpdatingQuote: mockIsUpdatingQuote,
    updateQuote: mockUpdateQuote,
  }),
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
  })
})
