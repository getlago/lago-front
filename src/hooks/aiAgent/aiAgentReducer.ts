import {
  AiConversationToolCallItemFragment,
  AiConversationToolCallStatusEnum,
} from '~/generated/graphql'

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
   * Start a new conversation
   * with a user message and a pending response from assistant
   */
  START_CONVERSATION = 'START_CONVERSATION',
  /**
   * Stream a chunk with the assistant message
   */
  STREAMING = 'STREAMING',
  /**
   * Set the assistant message to done
   */
  DONE = 'DONE',
  /**
   * Add a new message to the conversation
   */
  ADD_INPUT = 'ADD_INPUT',
  /**
   * Fill the pending assistant message of a completed exchange
   */
  COMPLETE_EXCHANGE = 'COMPLETE_EXCHANGE',
  /**
   * Drop the pending assistant message of a failed exchange and flag the error
   */
  FAIL_EXCHANGE = 'FAIL_EXCHANGE',
  /** Store the writes the agent stopped on, waiting for the member's confirmation */
  SET_PENDING_TOOL_CALLS = 'SET_PENDING_TOOL_CALLS',
  /** Record the member's answer to one of the pending writes */
  DECIDE_TOOL_CALL = 'DECIDE_TOOL_CALL',
  /** Every pending write is answered: wait for the agent to carry on */
  RESUME_CONVERSATION = 'RESUME_CONVERSATION',
  /**
   * Reset the conversation
   */
  RESET_CONVERSATION = 'RESET_CONVERSATION',
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
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  hasError: boolean
  financeSessionId?: string
  toolCalls: AiConversationToolCallItemFragment[]
}

type ChatAction =
  | { type: ChatActionType.START_CONVERSATION; message: string }
  | { type: ChatActionType.STREAMING; messageId: string; chunk: string }
  | { type: ChatActionType.DONE; messageId: string }
  | { type: ChatActionType.ADD_INPUT; message: string; exchangeId?: string }
  | {
      type: ChatActionType.COMPLETE_EXCHANGE
      exchangeId: string
      response: string
      sessionId?: string
      financeAssistantResult?: FinanceAssistantResult
    }
  | { type: ChatActionType.FAIL_EXCHANGE; exchangeId: string }
  | { type: ChatActionType.SET_PENDING_TOOL_CALLS; toolCalls: AiConversationToolCallItemFragment[] }
  | {
      type: ChatActionType.DECIDE_TOOL_CALL
      toolCallId: string
      status: AiConversationToolCallStatusEnum
    }
  | { type: ChatActionType.RESUME_CONVERSATION }
  | { type: ChatActionType.RESET_CONVERSATION }
  | {
      type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES
      messages: ChatMessage[]
      toolCalls?: AiConversationToolCallItemFragment[]
    }

export const hasPendingToolCalls = (state: ChatState): boolean =>
  state.toolCalls.some((toolCall) => toolCall.status === AiConversationToolCallStatusEnum.Pending)

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case ChatActionType.START_CONVERSATION: {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: ChatRole.user,
        message: action.message,
        status: ChatStatus.done,
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: ChatRole.assistant,
        message: '',
        status: ChatStatus.pending,
      }

      return {
        ...state,
        messages: [userMsg, assistantMsg],
        isStreaming: false,
        isLoading: true,
        hasError: false,
        toolCalls: [],
      }
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
        id: action.exchangeId ?? crypto.randomUUID(),
        role: ChatRole.assistant,
        message: '',
        status: ChatStatus.pending,
      }

      return {
        ...state,
        messages: [...state.messages, userMsg, assistantMsg],
        isLoading: true,
        isStreaming: false,
        hasError: false,
      }
    }

    case ChatActionType.COMPLETE_EXCHANGE: {
      const hasPendingExchange = state.messages.some(
        (message) => message.id === action.exchangeId && message.status === ChatStatus.pending,
      )

      // Stale completion (conversation was reset or replaced) — ignore it
      if (!hasPendingExchange) {
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
      const hasPendingExchange = state.messages.some(
        (message) => message.id === action.exchangeId && message.status === ChatStatus.pending,
      )

      // Stale failure (conversation was reset or replaced) — ignore it
      if (!hasPendingExchange) {
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

    case ChatActionType.SET_PENDING_TOOL_CALLS: {
      return {
        ...state,
        toolCalls: action.toolCalls,
      }
    }

    case ChatActionType.DECIDE_TOOL_CALL: {
      return {
        ...state,
        toolCalls: state.toolCalls.map((toolCall) =>
          toolCall.id === action.toolCallId ? { ...toolCall, status: action.status } : toolCall,
        ),
      }
    }

    case ChatActionType.RESUME_CONVERSATION: {
      // The agent answers the confirmed writes in a new assistant message
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: ChatRole.assistant,
        message: '',
        status: ChatStatus.pending,
      }

      return {
        ...state,
        messages: [...state.messages, assistantMsg],
        toolCalls: [],
        isLoading: true,
        isStreaming: false,
        hasError: false,
      }
    }

    case ChatActionType.RESET_CONVERSATION: {
      return {
        ...state,
        messages: [],
        isLoading: false,
        isStreaming: false,
        hasError: false,
        financeSessionId: undefined,
        toolCalls: [],
      }
    }

    case ChatActionType.SET_PREVIOUS_CHAT_MESSAGES: {
      return {
        ...state,
        messages: action.messages,
        isLoading: false,
        isStreaming: false,
        hasError: false,
        toolCalls: action.toolCalls ?? [],
      }
    }

    default:
      return state
  }
}
