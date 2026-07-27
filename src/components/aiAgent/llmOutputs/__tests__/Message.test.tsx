import { render, screen } from '@testing-library/react'

import { Message } from '~/components/aiAgent/llmOutputs'
import { ChatMessage, ChatRole, ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'

jest.mock('~/components/aiAgent/FinanceAssistantResult', () => ({
  FinanceAssistantResult: ({ message }: { message: { message: string } }) => (
    <div data-test="finance-assistant-result">{message.message}</div>
  ),
}))

jest.mock('~/components/aiAgent/llmOutputs/hook', () => ({
  useCustomLLMOutput: (output: string) => [
    {
      block: {
        component: () => <div data-test="llm-block">{output}</div>,
      },
    },
  ],
}))

const baseMessage: ChatMessage = {
  id: 'assistant-1',
  role: ChatRole.assistant,
  message: 'Plain markdown answer',
  status: ChatStatus.done,
}

describe('Message', () => {
  describe('GIVEN a message without a finance assistant result', () => {
    describe('WHEN it renders', () => {
      it('THEN should render the LLM output blocks', () => {
        render(<Message message={baseMessage} />)

        expect(screen.getByText('Plain markdown answer')).toBeInTheDocument()
        expect(screen.queryByText('finance-assistant-result')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a message carrying a finance assistant result', () => {
    describe('WHEN it renders', () => {
      it('THEN should render the finance assistant result instead of the LLM blocks', () => {
        const { container } = render(
          <Message message={{ ...baseMessage, financeAssistantResult: { results: '| a |' } }} />,
        )

        expect(
          container.querySelector('[data-test="finance-assistant-result"]'),
        ).toBeInTheDocument()
        expect(container.querySelector('[data-test="llm-block"]')).not.toBeInTheDocument()
      })
    })
  })
})
