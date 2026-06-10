import { fireEvent, render, screen } from '@testing-library/react'

import { FinanceAssistantResult } from '~/components/aiAgent/FinanceAssistantResult'
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

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) =>
      ({
        text_17805629795206sa8qhvz16j: 'Reveal SQL',
        text_1780562979520mxbgpqksusb: 'Hide SQL',
        text_178108767575418a6s91vcje: 'Session expired notice',
      })[key] || key,
  }),
}))

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
  it('renders explanation and results while hiding SQL by default', () => {
    render(<FinanceAssistantResult message={baseMessage} />)

    expect(screen.getByText('Here is the revenue summary.')).toBeInTheDocument()
    expect(screen.getByText(/Month/)).toBeInTheDocument()
    expect(screen.getByText(/January/)).toBeInTheDocument()
    expect(screen.queryByText('select * from invoices')).not.toBeInTheDocument()
    expect(screen.queryByText('Session expired notice')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reveal SQL' }))

    expect(screen.getByText('select * from invoices')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide SQL' })).toBeInTheDocument()
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
