import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { useAskFinanceAssistant } from '~/components/aiAgent/hooks/useAskFinanceAssistant'
import { AskFinanceAssistantDocument } from '~/generated/graphql'
import { ChatState } from '~/hooks/aiAgent/aiAgentReducer'
import { AllTheProviders, TestMocksType } from '~/test-utils'

const mockAddNewMessage = jest.fn()
const mockCompleteExchange = jest.fn()
const mockFailExchange = jest.fn()

let mockState: ChatState

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    addNewMessage: mockAddNewMessage,
    completeExchange: mockCompleteExchange,
    failExchange: mockFailExchange,
    state: mockState,
  }),
}))

const buildWrapper = (mocks: TestMocksType) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AllTheProviders mocks={mocks} forceTypenames>
        {children}
      </AllTheProviders>
    )
  }
}

const successMock = (sessionId?: string) => ({
  request: {
    query: AskFinanceAssistantDocument,
    variables: { input: { question: 'What is my MRR?', sessionId } },
  },
  result: {
    data: {
      askFinanceAssistant: {
        __typename: 'FinanceAssistantAnswer',
        explanation: 'Here is your MRR.',
        messageId: 'message-1',
        results: '| MRR |',
        sessionExpired: false,
        sessionId: 'session-1',
        sqlQuery: 'select 1',
      },
    },
  },
})

describe('useAskFinanceAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockState = {
      messages: [],
      isLoading: false,
      isStreaming: false,
      hasError: false,
      financeSessionId: undefined,
    }
  })

  describe('GIVEN a question is submitted', () => {
    describe('WHEN the mutation succeeds', () => {
      it('THEN should add the user message and complete the exchange with the mapped answer', async () => {
        const { result } = renderHook(() => useAskFinanceAssistant(), {
          wrapper: buildWrapper([successMock()]),
        })

        await act(async () => {
          await result.current.submitFinanceQuestion('What is my MRR?')
        })

        expect(mockAddNewMessage).toHaveBeenCalledWith('What is my MRR?', expect.any(String))

        const exchangeId = mockAddNewMessage.mock.calls[0][1]

        expect(mockCompleteExchange).toHaveBeenCalledWith({
          exchangeId,
          response: 'Here is your MRR.',
          sessionId: 'session-1',
          financeAssistantResult: {
            results: '| MRR |',
            sessionExpired: false,
            sqlQuery: 'select 1',
            messageId: 'message-1',
          },
        })
        expect(mockFailExchange).not.toHaveBeenCalled()
      })

      it('THEN should reuse the current finance session id', async () => {
        mockState = { ...mockState, financeSessionId: 'existing-session' }

        const { result } = renderHook(() => useAskFinanceAssistant(), {
          wrapper: buildWrapper([successMock('existing-session')]),
        })

        await act(async () => {
          await result.current.submitFinanceQuestion('What is my MRR?')
        })

        expect(mockCompleteExchange).toHaveBeenCalled()
      })
    })

    describe('WHEN the mutation returns no answer', () => {
      it('THEN should fail the exchange', async () => {
        const { result } = renderHook(() => useAskFinanceAssistant(), {
          wrapper: buildWrapper([
            {
              request: {
                query: AskFinanceAssistantDocument,
                variables: { input: { question: 'What is my MRR?', sessionId: undefined } },
              },
              result: { data: { askFinanceAssistant: null } },
            },
          ]),
        })

        await act(async () => {
          await result.current.submitFinanceQuestion('What is my MRR?')
        })

        const exchangeId = mockAddNewMessage.mock.calls[0][1]

        expect(mockFailExchange).toHaveBeenCalledWith(exchangeId)
        expect(mockCompleteExchange).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the mutation throws', () => {
      it('THEN should fail the exchange', async () => {
        const { result } = renderHook(() => useAskFinanceAssistant(), {
          wrapper: buildWrapper([
            {
              request: {
                query: AskFinanceAssistantDocument,
                variables: { input: { question: 'What is my MRR?', sessionId: undefined } },
              },
              error: new Error('boom'),
            },
          ]),
        })

        await act(async () => {
          await result.current.submitFinanceQuestion('What is my MRR?')
        })

        const exchangeId = mockAddNewMessage.mock.calls[0][1]

        expect(mockFailExchange).toHaveBeenCalledWith(exchangeId)
        expect(mockCompleteExchange).not.toHaveBeenCalled()
      })
    })
  })
})
