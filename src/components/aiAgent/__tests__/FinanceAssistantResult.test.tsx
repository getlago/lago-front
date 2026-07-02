import { fireEvent, render, screen } from '@testing-library/react'

import { FinanceAssistantResult } from '~/components/aiAgent/FinanceAssistantResult'
import { useExportFinanceAssistant } from '~/components/aiAgent/hooks/useExportFinanceAssistant'
import {
  ChatMessage,
  ChatRole,
  ChatStatus,
  FinanceAssistantResult as FinanceAssistantResultType,
} from '~/hooks/aiAgent/aiAgentReducer'

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}))

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('~/components/aiAgent/hooks/useExportFinanceAssistant')

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) =>
      ({
        text_17805629795206sa8qhvz16j: 'Reveal SQL',
        text_1780562979520mxbgpqksusb: 'Hide SQL',
        text_178108767575418a6s91vcje: 'Session expired notice',
        text_1782899568265kc2tovrmz2s: 'Export to CSV',
      })[key] || key,
  }),
}))

const mockExportResult = jest.fn()

beforeEach(() => {
  mockExportResult.mockReset()
  ;(useExportFinanceAssistant as jest.Mock).mockReturnValue({
    exportResult: mockExportResult,
    loading: false,
  })
})

const baseResult: FinanceAssistantResultType = {
  results: '| Month | MRR |\n| --- | --- |\n| January | $100 |',
  sqlQuery: 'select * from invoices',
}

const baseMessage: ChatMessage = {
  id: 'assistant-1',
  role: ChatRole.assistant,
  message: 'Here is the revenue summary.',
  status: ChatStatus.done,
  financeAssistantResult: baseResult,
}

describe('FinanceAssistantResult', () => {
  it('renders explanation and results without exposing the raw SQL', () => {
    render(<FinanceAssistantResult message={baseMessage} />)

    expect(screen.getByText('Here is the revenue summary.')).toBeInTheDocument()
    expect(screen.getByText(/Month/)).toBeInTheDocument()
    expect(screen.getByText(/January/)).toBeInTheDocument()
    expect(screen.queryByText('select * from invoices')).not.toBeInTheDocument()
    expect(screen.queryByText('Session expired notice')).not.toBeInTheDocument()
  })

  it('exports the full result to CSV when the export button is clicked', () => {
    render(
      <FinanceAssistantResult
        message={{
          ...baseMessage,
          financeAssistantResult: { ...baseResult, messageId: 'msg-1' },
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Export to CSV' }))

    expect(mockExportResult).toHaveBeenCalledWith('msg-1')
  })

  it('does not render the export button when there is no messageId', () => {
    render(<FinanceAssistantResult message={baseMessage} />)

    expect(screen.queryByRole('button', { name: 'Export to CSV' })).not.toBeInTheDocument()
  })

  it('shows a notice when the backend session expired', () => {
    render(
      <FinanceAssistantResult
        message={{
          ...baseMessage,
          financeAssistantResult: {
            ...baseResult,
            sessionExpired: true,
          },
        }}
      />,
    )

    expect(screen.getByText('Session expired notice')).toBeInTheDocument()
  })
})
