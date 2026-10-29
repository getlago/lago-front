import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { currentOrganizationVar } from '~/core/apolloClient/reactiveVars/currentOrganizationVar'
import { AiConversationToolCallStatusEnum } from '~/generated/graphql'
import { ChatRole, ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'
import {
  AI_AGENT_TYPE_LS_KEY,
  AiAgentProvider,
  AiAgentTypeEnum,
  useAiAgent,
} from '~/hooks/aiAgent/useAiAgent'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AiAgentProvider>{children}</AiAgentProvider>
)

const renderAiAgent = () => renderHook(() => useAiAgent(), { wrapper })

describe('useAiAgent', () => {
  beforeEach(() => {
    localStorage.clear()
    currentOrganizationVar(null)
  })

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
      it('THEN should default to the finance agent with an empty conversation', () => {
        const { result } = renderAiAgent()

        expect(result.current.agentType).toBe(AiAgentTypeEnum.finance)
        expect(result.current.conversationId).toBe('')
        expect(result.current.state.messages).toHaveLength(0)
      })
    })

    describe('WHEN an agent type is stored in localStorage', () => {
      it('THEN should restore the stored agent type', () => {
        localStorage.setItem(AI_AGENT_TYPE_LS_KEY, AiAgentTypeEnum.billing)

        const { result } = renderAiAgent()

        expect(result.current.agentType).toBe(AiAgentTypeEnum.billing)
      })
    })

    describe('WHEN the stored agent type is invalid', () => {
      it('THEN should fall back to the finance agent', () => {
        localStorage.setItem(AI_AGENT_TYPE_LS_KEY, 'not-an-agent')

        const { result } = renderAiAgent()

        expect(result.current.agentType).toBe(AiAgentTypeEnum.finance)
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

  describe('GIVEN the member switches organization', () => {
    describe('WHEN a conversation with pending writes is open', () => {
      it('THEN should reset the conversation', () => {
        act(() => {
          currentOrganizationVar('org-1')
        })

        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
          result.current.setPendingToolCalls([
            {
              id: 'tool-call-1',
              name: 'void_invoice',
              arguments: {},
              status: AiConversationToolCallStatusEnum.Pending,
            },
          ])
        })
        act(() => {
          currentOrganizationVar('org-2')
        })

        expect(result.current.conversationId).toBe('')
        expect(result.current.state.messages).toHaveLength(0)
        expect(result.current.state.toolCalls).toHaveLength(0)
      })
    })

    describe('WHEN the organization is set for the first time', () => {
      it('THEN should keep the conversation', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
        })
        act(() => {
          currentOrganizationVar('org-1')
        })

        expect(result.current.conversationId).toBe('conv-1')
      })
    })
  })

  describe('GIVEN the agent type changes', () => {
    describe('WHEN switching to another agent', () => {
      it('THEN should reset the ongoing conversation and persist the choice', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
        })
        act(() => {
          result.current.setAgentType(AiAgentTypeEnum.billing)
        })

        expect(result.current.agentType).toBe(AiAgentTypeEnum.billing)
        expect(result.current.conversationId).toBe('')
        expect(result.current.state.messages).toHaveLength(0)
        expect(localStorage.getItem(AI_AGENT_TYPE_LS_KEY)).toBe(AiAgentTypeEnum.billing)
      })
    })

    describe('WHEN setting the already selected agent', () => {
      it('THEN should keep the ongoing conversation untouched', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'hello' })
        })
        act(() => {
          result.current.setAgentType(AiAgentTypeEnum.finance)
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

  describe('GIVEN the billing agent stopped on writes to confirm', () => {
    const toolCalls = [
      {
        id: 'tool-call-1',
        name: 'void_invoice',
        arguments: { lago_id: 'invoice-1' },
        status: AiConversationToolCallStatusEnum.Pending,
      },
      {
        id: 'tool-call-2',
        name: 'create_coupon',
        arguments: { code: 'WELCOME' },
        status: AiConversationToolCallStatusEnum.Pending,
      },
    ]

    describe('WHEN the member answers one write and then the last one', () => {
      it('THEN should record the first answer and resume with a new pending assistant message', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.startNewConversation({ convId: 'conv-1', message: 'void and create' })
        })
        act(() => {
          result.current.setPendingToolCalls(toolCalls)
        })
        act(() => {
          result.current.decideToolCall({
            toolCallId: 'tool-call-1',
            status: AiConversationToolCallStatusEnum.Confirmed,
          })
        })

        expect(result.current.state.toolCalls.map((toolCall) => toolCall.status)).toEqual([
          AiConversationToolCallStatusEnum.Confirmed,
          AiConversationToolCallStatusEnum.Pending,
        ])

        const lastAssistantMessageId = result.current.lastAssistantMessage?.id

        act(() => {
          result.current.resumeConversation()
        })

        expect(result.current.state.toolCalls).toEqual([])
        expect(result.current.state.isLoading).toBe(true)
        expect(result.current.lastAssistantMessage?.id).not.toBe(lastAssistantMessageId)
        expect(result.current.lastAssistantMessage?.status).toBe(ChatStatus.pending)
      })
    })

    describe('WHEN the conversation is restored from history with pending writes', () => {
      it('THEN should expose the pending writes', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.setPreviousChatMessages({ convId: 'conv-1', messages: [], toolCalls })
        })

        expect(result.current.conversationId).toBe('conv-1')
        expect(result.current.state.toolCalls).toEqual(toolCalls)
      })
    })
  })
})
