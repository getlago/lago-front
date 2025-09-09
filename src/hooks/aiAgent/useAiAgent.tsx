import { createContext, ReactNode, useContext, useMemo, useReducer, useState } from 'react'

import {
  ChatActionType,
  ChatMessage,
  chatReducer,
  ChatRole,
  ChatState,
} from '~/hooks/aiAgent/aiAgentReducer'
import { usePanel, UsePanelReturn } from '~/hooks/ui/usePanel'

export enum AIPanelEnum {
  ai = 'ai',
}

interface AiAgentContextType extends UsePanelReturn<AIPanelEnum> {
  state: ChatState
  conversationId?: string
  lastAssistantMessage?: ChatMessage
  startNewConversation: ({ convId, message }: { convId: string; message: string }) => void
  streamChunk: ({ messageId, chunk }: { messageId: string; chunk: string }) => void
  setChatDone: (messageId: string) => void
  addNewMessage: (message: string) => void
  resetConversation: () => void
}

export const AiAgentContext = createContext<AiAgentContextType | undefined>(undefined)

export const PANEL_OPEN = 33
export const PANEL_CLOSED = 0

export function AiAgentProvider({ children }: { children: ReactNode }) {
  const panel = usePanel<AIPanelEnum>({
    size: {
      open: PANEL_OPEN,
      closed: PANEL_CLOSED,
    },
  })

  const [conversationId, setConversationId] = useState('')
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    isLoading: false,
  })

  const lastAssistantMessage = useMemo(() => {
    return state.messages.filter((message) => message.role === ChatRole.assistant).pop()
  }, [state.messages])

  const startNewConversation = ({ convId, message }: { convId: string; message: string }) => {
    setConversationId(convId)
    dispatch({
      type: ChatActionType.START_CONVERSATION,
      message: message,
    })
  }

  const resetConversation = () => {
    setConversationId('')
    dispatch({ type: ChatActionType.RESET_CONVERSATION })
  }

  const streamChunk = ({ messageId, chunk }: { messageId: string; chunk: string }) => {
    dispatch({
      type: ChatActionType.STREAMING,
      messageId,
      chunk,
    })
  }

  const setChatDone = (messageId: string) => {
    dispatch({ type: ChatActionType.DONE, messageId })
  }

  const addNewMessage = (message: string) => {
    dispatch({ type: ChatActionType.ADD_INPUT, message })
  }

  return (
    <AiAgentContext.Provider
      value={{
        ...panel,
        state,
        conversationId,
        lastAssistantMessage,
        startNewConversation,
        resetConversation,
        streamChunk,
        setChatDone,
        addNewMessage,
      }}
    >
      {children}
    </AiAgentContext.Provider>
  )
}

export function useAiAgent(): AiAgentContextType {
  const context = useContext(AiAgentContext)

  if (!context) {
    throw new Error('useAiAgent must be used within an AiAgentProvider')
  }

  return context
}
