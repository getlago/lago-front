export enum ChatRole {
  user = 'user',
  assistant = 'assistant',
}

export enum ChatStatus {
  pending = 'pending',
  streaming = 'streaming',
  done = 'done',
}

export enum ChatActionType {
  /**
   * Adopt a new user/organization scope, dropping the previous session
   */
  SET_SCOPE = 'SET_SCOPE',
  /**
   * Stream a chunk with the assistant message
   */
  STREAMING = 'STREAMING',
  /**
   * Set the assistant message to done
   */
  DONE = 'DONE',
  /**
   * Add a user message and the pending assistant message answering it
   */
  ADD_INPUT = 'ADD_INPUT',
  /** Attach the conversation the backend accepted a pending exchange into */
  CONFIRM_EXCHANGE = 'CONFIRM_EXCHANGE',
  /**
   * Fill the pending assistant message of a completed exchange
   */
  COMPLETE_EXCHANGE = 'COMPLETE_EXCHANGE',
  /**
   * Drop the pending assistant message of a failed exchange and flag the error
   */
  FAIL_EXCHANGE = 'FAIL_EXCHANGE',
  /**
   * Reset the conversation
   */
  RESET_CONVERSATION = 'RESET_CONVERSATION',
  /** Mark a history restore as the one this session is waiting for */
  START_RESTORE = 'START_RESTORE',
  /**
   * Set the previous chat messages
   */
  SET_PREVIOUS_CHAT_MESSAGES = 'SET_PREVIOUS_CHAT_MESSAGES',
}

export type FinanceAssistantResult = {
  results: string
  sqlQuery?: string
  sessionExpired?: boolean
  // per-answer id from the agent; the key /export uses to re-run this query's SQL
  messageId?: string
}

export type ChatMessage = {
  id: string
  role: ChatRole
  message: string
  status?: ChatStatus
  financeAssistantResult?: FinanceAssistantResult
}

export type ChatState = {
  scopeKey: string | null
  conversationId?: string
  pendingRestoreId?: string
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  hasError: boolean
  financeSessionId?: string
}

export const createChatSession = (scopeKey: string | null): ChatState => ({
  scopeKey,
  conversationId: undefined,
  pendingRestoreId: undefined,
  messages: [],
  isLoading: false,
  isStreaming: false,
  hasError: false,
  financeSessionId: undefined,
})

type ChatAction =
  | { type: ChatActionType.SET_SCOPE; scopeKey: string }
  | { type: ChatActionType.STREAMING; messageId: string; chunk: string }
  | { type: ChatActionType.DONE; messageId: string }
  | { type: ChatActionType.ADD_INPUT; message: string; exchangeId: string }
  | { type: ChatActionType.CONFIRM_EXCHANGE; exchangeId: string; conversationId: string }
  | {
      type: ChatActionType.COMPLETE_EXCHANGE
      exchangeId: string
      response: string
      sessionId?: string
      financeAssistantResult?: FinanceAssistantResult
    }
  | { type: ChatActionType.FAIL_EXCHANGE; exchangeId: string }
  | { type: ChatActionType.RESET_CONVERSATION }
  | { type: ChatActionType.START_RESTORE; restoreId: string }
  | {
      type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES
      restoreId: string
      conversationId: string
      messages: ChatMessage[]
    }

const hasPendingExchange = (state: ChatState, exchangeId: string): boolean =>
  state.messages.some(
    (message) => message.id === exchangeId && message.status === ChatStatus.pending,
  )

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case ChatActionType.SET_SCOPE: {
      return createChatSession(action.scopeKey)
    }

    case ChatActionType.STREAMING: {
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId
            ? {
                ...message,
                message: message.message + action.chunk,
                status: ChatStatus.streaming,
              }
            : message,
        ),
        isStreaming: true,
        isLoading: false,
      }
    }

    case ChatActionType.DONE: {
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId
            ? {
                ...message,
                status: ChatStatus.done,
              }
            : message,
        ),
        isStreaming: false,
        isLoading: false,
      }
    }

    case ChatActionType.ADD_INPUT: {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: ChatRole.user,
        message: action.message,
        status: ChatStatus.done,
      }

      const assistantMsg: ChatMessage = {
        id: action.exchangeId,
        role: ChatRole.assistant,
        message: '',
        status: ChatStatus.pending,
      }

      return {
        ...state,
        // A restore that lands after this would replace what the user just sent
        pendingRestoreId: undefined,
        messages: [...state.messages, userMsg, assistantMsg],
        isLoading: true,
        isStreaming: false,
        hasError: false,
      }
    }

    case ChatActionType.CONFIRM_EXCHANGE: {
      // Stale confirmation (session was replaced or reset) — ignore it
      if (!hasPendingExchange(state, action.exchangeId)) {
        return state
      }

      return {
        ...state,
        conversationId: action.conversationId,
      }
    }

    case ChatActionType.COMPLETE_EXCHANGE: {
      // Stale completion (session was replaced or reset) — ignore it
      if (!hasPendingExchange(state, action.exchangeId)) {
        return state
      }

      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.exchangeId
            ? {
                ...message,
                message: action.response,
                status: ChatStatus.done,
                financeAssistantResult: action.financeAssistantResult,
              }
            : message,
        ),
        isLoading: false,
        isStreaming: false,
        financeSessionId: action.sessionId ?? state.financeSessionId,
      }
    }

    case ChatActionType.FAIL_EXCHANGE: {
      // Stale failure (session was replaced or reset) — ignore it
      if (!hasPendingExchange(state, action.exchangeId)) {
        return state
      }

      return {
        ...state,
        messages: state.messages.filter((message) => message.id !== action.exchangeId),
        isLoading: false,
        isStreaming: false,
        hasError: true,
      }
    }

    case ChatActionType.RESET_CONVERSATION: {
      return createChatSession(state.scopeKey)
    }

    case ChatActionType.START_RESTORE: {
      return {
        ...state,
        pendingRestoreId: action.restoreId,
      }
    }

    case ChatActionType.SET_PREVIOUS_CHAT_MESSAGES: {
      // Stale restore (session was replaced, reset, or the user sent a message)
      if (state.pendingRestoreId !== action.restoreId) {
        return state
      }

      return {
        ...state,
        pendingRestoreId: undefined,
        conversationId: action.conversationId,
        messages: action.messages,
        isLoading: false,
        isStreaming: false,
        hasError: false,
      }
    }

    default:
      return state
  }
}
