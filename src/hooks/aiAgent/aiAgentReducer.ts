export enum ChatRole {
  user = 'user',
  assistant = 'assistant',
  system = 'system',
}

enum ChatStatus {
  pending = 'pending',
  streaming = 'streaming',
  done = 'done',
  error = 'error',
}

export type ChatMessage = {
  id: string
  role: ChatRole
  message: string
  status?: ChatStatus
}

type ChatState = {
  messages: ChatMessage[]
  isLoading: boolean
}

type ChatAction =
  | { type: 'ADD_USER'; message: string }
  | { type: 'START_ASSISTANT'; id: string }
  | { type: 'STREAM_TOKEN'; id: string; token: string }
  | { type: 'DONE'; id: string }
  | { type: 'ERROR'; id: string }

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_USER': {
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
        status: ChatStatus.streaming,
      }

      return {
        ...state,
        messages: [...state.messages, userMsg, assistantMsg],
        isLoading: true,
      }
    }

    case 'STREAM_TOKEN': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, message: m.message + action.token } : m,
        ),
      }
    }

    case 'DONE': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, status: ChatStatus.done } : m,
        ),
        isLoading: false,
      }
    }

    case 'ERROR': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, status: ChatStatus.error } : m,
        ),
        isLoading: false,
      }
    }

    default:
      return state
  }
}
