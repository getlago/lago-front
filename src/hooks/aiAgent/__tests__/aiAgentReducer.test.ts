import {
  ChatActionType,
  ChatMessage,
  chatReducer,
  ChatRole,
  ChatState,
  ChatStatus,
  createChatSession,
} from '~/hooks/aiAgent/aiAgentReducer'

beforeAll(() => {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}` },
      configurable: true,
    })
  }
})

const SCOPE_KEY = 'user-1:org-1'

const emptyState: ChatState = createChatSession(SCOPE_KEY)

const pendingExchangeState = (exchangeId: string): ChatState => ({
  ...emptyState,
  isLoading: true,
  messages: [
    { id: 'user-1', role: ChatRole.user, message: 'question', status: ChatStatus.done },
    { id: exchangeId, role: ChatRole.assistant, message: '', status: ChatStatus.pending },
  ],
})

describe('chatReducer', () => {
  describe('SET_SCOPE', () => {
    it('drops the previous scope session entirely', () => {
      const populated: ChatState = {
        ...pendingExchangeState('exchange-1'),
        conversationId: 'conv-1',
        pendingRestoreId: 'restore-1',
        financeSessionId: 'session-1',
      }

      const state = chatReducer(populated, {
        type: ChatActionType.SET_SCOPE,
        scopeKey: 'user-1:org-2',
      })

      expect(state).toEqual(createChatSession('user-1:org-2'))
    })

    it('drops what the previous scope had in flight', () => {
      const switched = chatReducer(pendingExchangeState('exchange-1'), {
        type: ChatActionType.SET_SCOPE,
        scopeKey: 'user-1:org-2',
      })

      const state = chatReducer(switched, {
        type: ChatActionType.COMPLETE_EXCHANGE,
        exchangeId: 'exchange-1',
        response: 'answer from the previous organization',
      })

      expect(state).toEqual(switched)
    })
  })

  describe('STREAMING', () => {
    it('appends the chunk to the matching message and flags the streaming state', () => {
      const state = chatReducer(pendingExchangeState('exchange-1'), {
        type: ChatActionType.STREAMING,
        messageId: 'exchange-1',
        chunk: 'partial',
      })

      expect(state.messages[1]).toMatchObject({
        message: 'partial',
        status: ChatStatus.streaming,
      })
      expect(state.isStreaming).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('leaves other messages untouched', () => {
      const state = chatReducer(pendingExchangeState('exchange-1'), {
        type: ChatActionType.STREAMING,
        messageId: 'exchange-1',
        chunk: 'partial',
      })

      expect(state.messages[0]).toMatchObject({ id: 'user-1', message: 'question' })
    })
  })

  describe('DONE', () => {
    it('marks the matching message as done and stops the streaming state', () => {
      const streaming = chatReducer(pendingExchangeState('exchange-1'), {
        type: ChatActionType.STREAMING,
        messageId: 'exchange-1',
        chunk: 'partial',
      })

      const state = chatReducer(streaming, {
        type: ChatActionType.DONE,
        messageId: 'exchange-1',
      })

      expect(state.messages[1]).toMatchObject({
        message: 'partial',
        status: ChatStatus.done,
      })
      expect(state.isStreaming).toBe(false)
      expect(state.isLoading).toBe(false)
    })
  })

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
        { type: ChatActionType.ADD_INPUT, message: 'question', exchangeId: 'exchange-1' },
      )

      expect(state.hasError).toBe(false)
    })
  })

  describe('CONFIRM_EXCHANGE', () => {
    it('attaches the accepted conversation to the pending exchange', () => {
      const state = chatReducer(pendingExchangeState('exchange-1'), {
        type: ChatActionType.CONFIRM_EXCHANGE,
        exchangeId: 'exchange-1',
        conversationId: 'conv-1',
      })

      expect(state.conversationId).toBe('conv-1')
    })

    it('no-ops for a stale confirmation (no matching pending message)', () => {
      const state = chatReducer(emptyState, {
        type: ChatActionType.CONFIRM_EXCHANGE,
        exchangeId: 'exchange-1',
        conversationId: 'conv-1',
      })

      expect(state).toEqual(emptyState)
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

      expect(state).toEqual(createChatSession(SCOPE_KEY))
    })
  })

  describe('SET_PREVIOUS_CHAT_MESSAGES', () => {
    const restoredMessages: ChatMessage[] = [
      { id: 'a', role: ChatRole.user, message: 'hi', status: ChatStatus.done },
    ]

    it('replaces messages, attaches the conversation and clears error state', () => {
      const awaiting = chatReducer(
        { ...emptyState, hasError: true },
        { type: ChatActionType.START_RESTORE, restoreId: 'restore-1' },
      )

      const state = chatReducer(awaiting, {
        type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES,
        restoreId: 'restore-1',
        conversationId: 'conv-1',
        messages: restoredMessages,
      })

      expect(state.messages).toEqual(restoredMessages)
      expect(state.conversationId).toBe('conv-1')
      expect(state.pendingRestoreId).toBeUndefined()
      expect(state.hasError).toBe(false)
    })

    it('no-ops when the session is not waiting for that restore', () => {
      const state = chatReducer(emptyState, {
        type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES,
        restoreId: 'restore-1',
        conversationId: 'conv-1',
        messages: restoredMessages,
      })

      expect(state).toEqual(emptyState)
    })

    it('no-ops when a scope change dropped the pending restore', () => {
      const awaiting = chatReducer(emptyState, {
        type: ChatActionType.START_RESTORE,
        restoreId: 'restore-1',
      })
      const switched = chatReducer(awaiting, {
        type: ChatActionType.SET_SCOPE,
        scopeKey: 'user-1:org-2',
      })

      const state = chatReducer(switched, {
        type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES,
        restoreId: 'restore-1',
        conversationId: 'conv-1',
        messages: restoredMessages,
      })

      expect(state).toEqual(switched)
    })

    it('no-ops when the user sent a message while the restore was in flight', () => {
      const awaiting = chatReducer(emptyState, {
        type: ChatActionType.START_RESTORE,
        restoreId: 'restore-1',
      })
      const sent = chatReducer(awaiting, {
        type: ChatActionType.ADD_INPUT,
        message: 'question',
        exchangeId: 'exchange-1',
      })

      const state = chatReducer(sent, {
        type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES,
        restoreId: 'restore-1',
        conversationId: 'conv-1',
        messages: restoredMessages,
      })

      expect(state).toEqual(sent)
    })
  })
})
