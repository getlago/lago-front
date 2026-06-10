import {
  ChatActionType,
  ChatMessage,
  chatReducer,
  ChatRole,
  ChatState,
  ChatStatus,
} from '~/hooks/aiAgent/aiAgentReducer'

beforeAll(() => {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}` },
      configurable: true,
    })
  }
})

const emptyState: ChatState = {
  messages: [],
  isLoading: false,
  isStreaming: false,
  hasError: false,
  financeSessionId: undefined,
}

const pendingExchangeState = (exchangeId: string): ChatState => ({
  ...emptyState,
  isLoading: true,
  messages: [
    { id: 'user-1', role: ChatRole.user, message: 'question', status: ChatStatus.done },
    { id: exchangeId, role: ChatRole.assistant, message: '', status: ChatStatus.pending },
  ],
})

describe('chatReducer', () => {
  describe('ADD_INPUT', () => {
    it('adds a user message and a pending assistant message with the given exchangeId', () => {
      const state = chatReducer(emptyState, {
        type: ChatActionType.ADD_INPUT,
        message: 'question',
        exchangeId: 'exchange-1',
      })

      expect(state.messages).toHaveLength(2)
      expect(state.messages[0]).toMatchObject({ role: ChatRole.user, message: 'question' })
      expect(state.messages[1]).toMatchObject({
        id: 'exchange-1',
        role: ChatRole.assistant,
        status: ChatStatus.pending,
      })
      expect(state.isLoading).toBe(true)
      expect(state.hasError).toBe(false)
    })

    it('clears a previous error', () => {
      const state = chatReducer(
        { ...emptyState, hasError: true },
        { type: ChatActionType.ADD_INPUT, message: 'question' },
      )

      expect(state.hasError).toBe(false)
    })
  })

  describe('COMPLETE_EXCHANGE', () => {
    it('fills the matching pending assistant message and stores the session id', () => {
      const state = chatReducer(pendingExchangeState('exchange-1'), {
        type: ChatActionType.COMPLETE_EXCHANGE,
        exchangeId: 'exchange-1',
        response: 'answer',
        sessionId: 'session-1',
        financeAssistantResult: { results: '| a |' },
      })

      const assistantMsg = state.messages[1]

      expect(assistantMsg.message).toBe('answer')
      expect(assistantMsg.status).toBe(ChatStatus.done)
      expect(assistantMsg.financeAssistantResult).toEqual({ results: '| a |' })
      expect(state.isLoading).toBe(false)
      expect(state.financeSessionId).toBe('session-1')
    })

    it('no-ops for a stale completion (no matching pending message)', () => {
      const state = chatReducer(emptyState, {
        type: ChatActionType.COMPLETE_EXCHANGE,
        exchangeId: 'exchange-1',
        response: 'late answer',
        sessionId: 'session-1',
      })

      expect(state).toEqual(emptyState)
    })
  })

  describe('FAIL_EXCHANGE', () => {
    it('removes the pending assistant message, keeps the user message and flags the error', () => {
      const state = chatReducer(pendingExchangeState('exchange-1'), {
        type: ChatActionType.FAIL_EXCHANGE,
        exchangeId: 'exchange-1',
      })

      expect(state.messages).toHaveLength(1)
      expect(state.messages[0].role).toBe(ChatRole.user)
      expect(state.isLoading).toBe(false)
      expect(state.hasError).toBe(true)
    })

    it('no-ops for a stale failure (no matching pending message)', () => {
      const state = chatReducer(emptyState, {
        type: ChatActionType.FAIL_EXCHANGE,
        exchangeId: 'exchange-1',
      })

      expect(state).toEqual(emptyState)
    })
  })

  describe('RESET_CONVERSATION', () => {
    it('clears messages, error and finance session id', () => {
      const populated: ChatState = {
        ...pendingExchangeState('exchange-1'),
        hasError: true,
        financeSessionId: 'session-1',
      }

      const state = chatReducer(populated, { type: ChatActionType.RESET_CONVERSATION })

      expect(state.messages).toHaveLength(0)
      expect(state.hasError).toBe(false)
      expect(state.financeSessionId).toBeUndefined()
    })
  })

  describe('SET_PREVIOUS_CHAT_MESSAGES', () => {
    it('replaces messages and clears error state', () => {
      const messages: ChatMessage[] = [
        { id: 'a', role: ChatRole.user, message: 'hi', status: ChatStatus.done },
      ]

      const state = chatReducer(
        { ...emptyState, hasError: true },
        { type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES, messages },
      )

      expect(state.messages).toEqual(messages)
      expect(state.hasError).toBe(false)
    })
  })
})
