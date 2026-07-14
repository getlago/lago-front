import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { ChatRole, ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'
import { AiAgentProvider, AiAgentTypeEnum, useAiAgent } from '~/hooks/aiAgent/useAiAgent'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AiAgentProvider>{children}</AiAgentProvider>
)

const renderAiAgent = () => renderHook(() => useAiAgent(), { wrapper })

describe('useAiAgent', () => {
  describe('GIVEN the hook is used outside the provider', () => {
    describe('WHEN it is called', () => {
      it('THEN should throw an explicit error', () => {
        // Silence React's error boundary logging for the expected throw
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        expect(() => renderHook(() => useAiAgent())).toThrow(
          'useAiAgent must be used within an AiAgentProvider',
        )

        consoleSpy.mockRestore()
      })
    })
  })

  describe('GIVEN the provider default state', () => {
    describe('WHEN the hook mounts', () => {
      it('THEN should default to the billing agent with an empty conversation', () => {
        const { result } = renderAiAgent()

        expect(result.current.agentType).toBe(AiAgentTypeEnum.billing)
        expect(result.current.conversationId).toBe('')
        expect(result.current.state.messages).toHaveLength(0)
      })
    })
  })

  describe('GIVEN a conversation is started', () => {
    describe('WHEN startNewConversation is called', () => {
      it('THEN should store the conversation id and seed the exchange', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
        })

        expect(result.current.conversationId).toBe('conv-1')
        expect(result.current.state.messages).toHaveLength(2)
        expect(result.current.state.messages[0]).toMatchObject({
          role: ChatRole.user,
          message: 'hello',
        })
        expect(result.current.state.isLoading).toBe(true)
      })
    })

    describe('WHEN resetConversation is called', () => {
      it('THEN should clear the conversation id and the messages', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
        })
        act(() => {
          result.current.resetConversation()
        })

        expect(result.current.conversationId).toBe('')
        expect(result.current.state.messages).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the agent type changes', () => {
    describe('WHEN switching to another agent', () => {
      it('THEN should reset the ongoing conversation', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
        })
        act(() => {
          result.current.setAgentType(AiAgentTypeEnum.finance)
        })

        expect(result.current.agentType).toBe(AiAgentTypeEnum.finance)
        expect(result.current.conversationId).toBe('')
        expect(result.current.state.messages).toHaveLength(0)
      })
    })

    describe('WHEN setting the already selected agent', () => {
      it('THEN should keep the ongoing conversation untouched', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
        })
        act(() => {
          result.current.setAgentType(AiAgentTypeEnum.billing)
        })

        expect(result.current.conversationId).toBe('conv-1')
        expect(result.current.state.messages).toHaveLength(2)
      })
    })
  })

  describe('GIVEN previous chat messages are restored from history', () => {
    describe('WHEN setPreviousChatMessages is called while on the finance agent', () => {
      it('THEN should route back to the billing agent with the restored messages', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.setAgentType(AiAgentTypeEnum.finance)
        })
        act(() => {
          result.current.setPreviousChatMessages({
            convId: 'conv-1',
            messages: [
              { id: 'user-1', role: ChatRole.user, message: 'hello', status: ChatStatus.done },
            ],
          })
        })

        expect(result.current.agentType).toBe(AiAgentTypeEnum.billing)
        expect(result.current.conversationId).toBe('conv-1')
        expect(result.current.state.messages).toHaveLength(1)
      })
    })
  })

  describe('GIVEN a finance exchange lifecycle', () => {
    describe('WHEN the exchange completes', () => {
      it('THEN should fill the pending assistant message and expose it as the last assistant message', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('question', 'exchange-1')
        })
        act(() => {
          result.current.completeExchange({
            exchangeId: 'exchange-1',
            response: 'answer',
            sessionId: 'session-1',
            financeAssistantResult: { results: '| a |' },
          })
        })

        expect(result.current.lastAssistantMessage).toMatchObject({
          id: 'exchange-1',
          message: 'answer',
          status: ChatStatus.done,
        })
        expect(result.current.state.financeSessionId).toBe('session-1')
      })
    })

    describe('WHEN the exchange fails', () => {
      it('THEN should drop the pending assistant message and flag the error', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('question', 'exchange-1')
        })
        act(() => {
          result.current.failExchange('exchange-1')
        })

        expect(result.current.state.hasError).toBe(true)
        expect(result.current.state.messages).toHaveLength(1)
      })
    })
  })

  describe('GIVEN a billing streaming lifecycle', () => {
    describe('WHEN chunks stream in and the stream completes', () => {
      it('THEN should accumulate the chunks and mark the message as done', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
        })

        const assistantId = result.current.state.messages[1].id

        act(() => {
          result.current.streamChunk({ messageId: assistantId, chunk: 'par' })
        })
        act(() => {
          result.current.streamChunk({ messageId: assistantId, chunk: 'tial' })
        })
        act(() => {
          result.current.setChatDone(assistantId)
        })

        expect(result.current.lastAssistantMessage).toMatchObject({
          message: 'partial',
          status: ChatStatus.done,
        })
        expect(result.current.state.isStreaming).toBe(false)
      })
    })
  })
})
