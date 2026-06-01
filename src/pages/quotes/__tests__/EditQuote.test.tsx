import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'

import { RIGHT_ASIDE_PAGE_HEADER_TEST_ID } from '~/components/layouts/RightAsidePage'
import { render, testMockNavigateFn } from '~/test-utils'

import EditQuote from '../EditQuote'

// --- Shared state for mocks ---

let capturedOnChange: (() => void) | undefined
let mockMarkdownContent = '# Mock markdown content'

type AsideCallbacks = {
  onSaveStart?: () => void
  onSaveFinished?: () => void
  onSaveError?: (payload: unknown) => void
}

let capturedAsideCallbacks: AsideCallbacks = {}

// --- Mocks ---

// drawerStack.ts uses import.meta.hot — mock the entire useDrawer module instead
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

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
    onChange,
  }: {
    getMarkdownRef?: React.MutableRefObject<(() => string) | null>
    onChange?: () => void
  }) => {
    React.useEffect(() => {
      if (getMarkdownRef) {
        getMarkdownRef.current = () => mockMarkdownContent
      }
      capturedOnChange = onChange

      return () => {
        if (getMarkdownRef) {
          getMarkdownRef.current = null
        }
      }
    }, [getMarkdownRef, onChange])

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
    default: (props: {
      onSaveStart?: () => void
      onSaveFinished?: () => void
      onSaveError?: (payload: unknown) => void
    }) => {
      capturedAsideCallbacks = {
        onSaveStart: props.onSaveStart,
        onSaveFinished: props.onSaveFinished,
        onSaveError: props.onSaveError,
      }

      return <div data-test="mock-edit-quote-aside" />
    },
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

// --- Helpers ---

const getCloseButton = () => {
  const header = screen.getByTestId(RIGHT_ASIDE_PAGE_HEADER_TEST_ID)
  const buttons = header.querySelectorAll('[data-test="button"]')

  return buttons[buttons.length - 1] as HTMLButtonElement
}

// --- Tests ---

describe('EditQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockIsUpdatingQuoteVersion = false
    mockIsUpdatingQuote = false
    mockMarkdownContent = '# Mock markdown content'
    capturedOnChange = undefined
    capturedAsideCallbacks = {}

    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ quoteId: 'quote-123' })
    mockUseQuote.mockReturnValue({ quote: mockQuote, loading: false, refetch: jest.fn() })
  })

  describe('GIVEN the quote is loading', () => {
    describe('WHEN rendered', () => {
      it('THEN should not display quote number', () => {
        mockUseQuote.mockReturnValue({ quote: null, loading: true, refetch: jest.fn() })

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

  describe('GIVEN the close button is clicked', () => {
    describe('WHEN the quote is loaded', () => {
      it('THEN should navigate to the quote details page', async () => {
        const user = userEvent.setup()

        render(<EditQuote />)

        await user.click(getCloseButton())

        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-123/overview')
      })
    })

    describe('WHEN quoteId is not available', () => {
      it('THEN should not navigate', async () => {
        const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

        useParamsMock.mockReturnValue({})

        const user = userEvent.setup()

        render(<EditQuote />)

        await user.click(getCloseButton())

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the editor mode toggle button', () => {
    describe('WHEN the toggle button is clicked', () => {
      it('THEN should switch from edit to preview mode', async () => {
        const user = userEvent.setup()

        render(<EditQuote />)

        // In edit mode, the button shows the preview label
        expect(screen.getByText('text_17792789377356rxkbkmpu81')).toBeInTheDocument()

        // Click the toggle button (the first button in the header children area)
        const toggleButton = screen
          .getByText('text_17792789377356rxkbkmpu81')
          .closest('[data-test="button"]') as HTMLElement

        await user.click(toggleButton)

        // Now in preview mode, the button shows the edit label
        await waitFor(() => {
          expect(screen.getByText('text_1779278937735vlpgsllouzy')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the auto-save flow', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    describe('WHEN content changes after editor is ready', () => {
      it('THEN should debounce and call updateQuoteVersion', async () => {
        mockUpdateQuoteVersion.mockResolvedValue({
          data: { updateQuoteVersion: { id: 'version-1' } },
        })

        render(<EditQuote />)

        // Let the editor initialize (setTimeout(0) in useEffect)
        await act(async () => {
          jest.advanceTimersByTime(0)
        })

        // Simulate content change
        mockMarkdownContent = '# Updated content'

        act(() => {
          capturedOnChange?.()
        })

        // Should show saving status
        await waitFor(() => {
          expect(screen.getByText('text_1779268404389431dgsiiysk')).toBeInTheDocument()
        })

        // Advance past the debounce delay (2000ms)
        await act(async () => {
          jest.advanceTimersByTime(2000)
        })

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledWith(
            expect.objectContaining({
              id: 'version-1',
              content: '# Updated content',
            }),
            false,
          )
        })
      })
    })

    describe('WHEN content has not changed from baseline', () => {
      it('THEN should not trigger a save', async () => {
        render(<EditQuote />)

        // Let the editor initialize
        await act(async () => {
          jest.advanceTimersByTime(0)
        })

        // Fire onChange without changing the content
        act(() => {
          capturedOnChange?.()
        })

        // Advance past debounce
        await act(async () => {
          jest.advanceTimersByTime(2000)
        })

        expect(mockUpdateQuoteVersion).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the aside callbacks', () => {
    describe('WHEN onSaveStart is called from the aside', () => {
      it('THEN should set save status to saving', async () => {
        render(<EditQuote />)

        act(() => {
          capturedAsideCallbacks.onSaveStart?.()
        })

        await waitFor(() => {
          expect(screen.getByText('text_1779268404389431dgsiiysk')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN onSaveError is called from the aside with a payload', () => {
      it('THEN should set save status to error', async () => {
        render(<EditQuote />)

        act(() => {
          capturedAsideCallbacks.onSaveError?.({ id: 'version-1', startDate: '2026-01-01' })
        })

        await waitFor(() => {
          expect(screen.getByText('text_1779437694622y666yr137gm')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN retry is clicked after aside error stored a payload', () => {
      it('THEN should call updateQuoteVersion with the stored payload', async () => {
        mockUpdateQuoteVersion.mockResolvedValue({
          data: { updateQuoteVersion: { id: 'version-1' } },
        })

        render(<EditQuote />)

        const initialButtons = screen.getAllByTestId('button')

        // Trigger error from aside with a payload — this stores it in failedPayloadRef
        act(() => {
          capturedAsideCallbacks.onSaveError?.({ id: 'version-1', startDate: '2026-06-01' })
        })

        await waitFor(() => {
          expect(screen.getByText('text_1779437694622y666yr137gm')).toBeInTheDocument()
        })

        // Find and click the retry button
        const allButtons = screen.getAllByTestId('button')
        const retryButton = allButtons.find((btn) => !initialButtons.includes(btn)) as HTMLElement

        await act(async () => {
          retryButton.click()
        })

        await waitFor(() => {
          expect(mockUpdateQuoteVersion).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'version-1', startDate: '2026-06-01' }),
            false,
          )
        })
      })
    })
  })

  describe('GIVEN the close button disabled state', () => {
    describe('WHEN a mutation is in progress', () => {
      it('THEN should disable the close button', () => {
        mockIsUpdatingQuoteVersion = true

        render(<EditQuote />)

        expect(getCloseButton()).toBeDisabled()
      })
    })
  })
})
