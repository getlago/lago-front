import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { Router } from 'react-router'

import { ChatRole, ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'
import {
  AI_AGENT_TYPE_LS_KEY,
  AiAgentProvider,
  AiAgentTypeEnum,
  useAiAgent,
} from '~/hooks/aiAgent/useAiAgent'

type Membership = { organization: { id: string; slug: string } }

let mockUserId: string | undefined
let mockMemberships: Membership[]
let mockPathname: string

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    currentUser: mockUserId ? { id: mockUserId, memberships: mockMemberships } : undefined,
  }),
}))

// A controlled `location` lets a single provider instance observe navigation,
// which `MemoryRouter`'s own history cannot be driven to do from a test.
const navigator = {
  createHref: (to: unknown) => String(to),
  push: () => undefined,
  replace: () => undefined,
  go: () => undefined,
} as never

const wrapper = ({ children }: { children: ReactNode }) => (
  <Router location={mockPathname} navigator={navigator}>
    <AiAgentProvider>{children}</AiAgentProvider>
  </Router>
)

const renderAiAgent = () => renderHook(() => useAiAgent(), { wrapper })

describe('useAiAgent', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUserId = 'user-1'
    mockMemberships = [
      { organization: { id: 'org-1', slug: 'acme' } },
      { organization: { id: 'org-2', slug: 'globex' } },
    ]
    mockPathname = '/acme/customers'
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
        expect(result.current.conversationId).toBeUndefined()
        expect(result.current.state.messages).toHaveLength(0)
      })

      it('THEN should adopt the scope of the organization in the URL', () => {
        const { result } = renderAiAgent()

        expect(result.current.state.scopeKey).toBe('user-1:org-1')
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
    describe('WHEN the exchange is confirmed', () => {
      it('THEN should store the conversation id and seed the exchange', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })
        act(() => {
          result.current.confirmExchange({ exchangeId: 'exchange-1', conversationId: 'conv-1' })
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
          result.current.addNewMessage('hello', 'exchange-1')
        })
        act(() => {
          result.current.confirmExchange({ exchangeId: 'exchange-1', conversationId: 'conv-1' })
        })
        act(() => {
          result.current.resetConversation()
        })

        expect(result.current.conversationId).toBeUndefined()
        expect(result.current.state.messages).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the agent type changes', () => {
    describe('WHEN switching to another agent', () => {
      it('THEN should reset the ongoing conversation and persist the choice', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })
        act(() => {
          result.current.setAgentType(AiAgentTypeEnum.billing)
        })

        expect(result.current.agentType).toBe(AiAgentTypeEnum.billing)
        expect(result.current.conversationId).toBeUndefined()
        expect(result.current.state.messages).toHaveLength(0)
        expect(localStorage.getItem(AI_AGENT_TYPE_LS_KEY)).toBe(AiAgentTypeEnum.billing)
      })
    })

    describe('WHEN setting the already selected agent', () => {
      it('THEN should keep the ongoing conversation untouched', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })
        act(() => {
          result.current.setAgentType(AiAgentTypeEnum.finance)
        })

        expect(result.current.state.messages).toHaveLength(2)
      })
    })
  })

  describe('GIVEN previous chat messages are restored from history', () => {
    describe('WHEN the restore the session is waiting for lands', () => {
      it('THEN should route back to the billing agent with the restored messages', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.setAgentType(AiAgentTypeEnum.finance)
        })
        act(() => {
          result.current.startRestore('restore-1')
        })
        act(() => {
          result.current.setPreviousChatMessages({
            restoreId: 'restore-1',
            conversationId: 'conv-1',
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

    describe('WHEN two exchanges are submitted back to back', () => {
      it('THEN should complete both', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('first', 'exchange-1')
        })
        act(() => {
          result.current.addNewMessage('second', 'exchange-2')
        })
        act(() => {
          result.current.completeExchange({ exchangeId: 'exchange-2', response: 'second answer' })
        })
        act(() => {
          result.current.completeExchange({ exchangeId: 'exchange-1', response: 'first answer' })
        })

        expect(result.current.state.messages.map((message) => message.message)).toEqual([
          'first',
          'first answer',
          'second',
          'second answer',
        ])
      })
    })
  })

  describe('GIVEN a billing streaming lifecycle', () => {
    describe('WHEN chunks stream in and the stream completes', () => {
      it('THEN should accumulate the chunks and mark the message as done', () => {
        const { result } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })
        act(() => {
          result.current.streamChunk({ messageId: 'exchange-1', chunk: 'par' })
        })
        act(() => {
          result.current.streamChunk({ messageId: 'exchange-1', chunk: 'tial' })
        })
        act(() => {
          result.current.setChatDone('exchange-1')
        })

        expect(result.current.lastAssistantMessage).toMatchObject({
          message: 'partial',
          status: ChatStatus.done,
        })
        expect(result.current.state.isStreaming).toBe(false)
      })
    })
  })

  describe('GIVEN an ongoing conversation', () => {
    describe('WHEN the tab moves to another organization', () => {
      it('THEN should drop the conversation on the same render as the navigation', () => {
        const { result, rerender } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })
        act(() => {
          result.current.confirmExchange({ exchangeId: 'exchange-1', conversationId: 'conv-1' })
        })

        mockPathname = '/globex/customers'
        rerender()

        expect(result.current.state.scopeKey).toBe('user-1:org-2')
        expect(result.current.state.messages).toHaveLength(0)
        expect(result.current.conversationId).toBeUndefined()
      })

      it('THEN should drop what the previous organization had in flight', () => {
        const { result, rerender } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })

        mockPathname = '/globex/customers'
        rerender()

        act(() => {
          result.current.completeExchange({ exchangeId: 'exchange-1', response: 'late answer' })
        })
        act(() => {
          result.current.setPreviousChatMessages({
            restoreId: 'restore-1',
            conversationId: 'conv-1',
            messages: [
              { id: 'user-1', role: ChatRole.user, message: 'restored', status: ChatStatus.done },
            ],
          })
        })

        expect(result.current.state.messages).toHaveLength(0)
      })
    })

    describe('WHEN another user takes over the session', () => {
      it('THEN should drop the conversation', () => {
        const { result, rerender } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })

        mockUserId = 'user-2'
        rerender()

        expect(result.current.state.scopeKey).toBe('user-2:org-1')
        expect(result.current.state.messages).toHaveLength(0)
      })
    })

    describe('WHEN the current organization is renamed', () => {
      it('THEN should keep the conversation', () => {
        const { result, rerender } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })

        mockMemberships = [
          { organization: { id: 'org-1', slug: 'acme-renamed' } },
          { organization: { id: 'org-2', slug: 'globex' } },
        ]
        mockPathname = '/acme-renamed/customers'
        rerender()

        expect(result.current.state.scopeKey).toBe('user-1:org-1')
        expect(result.current.state.messages).toHaveLength(2)
      })
    })

    describe('WHEN the tab moves to a route carrying no organization slug', () => {
      it('THEN should keep the conversation rather than churn on an empty scope', () => {
        const { result, rerender } = renderAiAgent()

        act(() => {
          result.current.addNewMessage('hello', 'exchange-1')
        })

        mockPathname = '/login'
        rerender()

        expect(result.current.state.scopeKey).toBe('user-1:org-1')
        expect(result.current.state.messages).toHaveLength(2)

        mockPathname = '/acme/customers'
        rerender()

        expect(result.current.state.messages).toHaveLength(2)
      })
    })
  })
})
