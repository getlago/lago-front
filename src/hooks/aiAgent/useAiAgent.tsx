import { createContext, ReactNode, useContext, useMemo, useReducer, useState } from 'react'

import {
  ChatActionType,
  ChatMessage,
  chatReducer,
  ChatRole,
  ChatState,
  FinanceAssistantResult,
} from '~/hooks/aiAgent/aiAgentReducer'
import { usePanel, UsePanelReturn } from '~/hooks/ui/usePanel'

export enum AIPanelEnum {
  ai = 'ai',
}

export enum AiAgentTypeEnum {
  billing = 'billing',
  finance = 'finance',
}

export const AGENT_TYPE_LABELS: Record<AiAgentTypeEnum, string> = {
  [AiAgentTypeEnum.billing]: 'text_1780562979519nd49yg82e20',
  [AiAgentTypeEnum.finance]: 'text_17805629795197990fik8a0f',
}

interface AiAgentContextType extends UsePanelReturn<AIPanelEnum> {
  state: ChatState
  conversationId?: string
  agentType: AiAgentTypeEnum
  lastAssistantMessage?: ChatMessage
  setAgentType: (agentType: AiAgentTypeEnum) => void
  openPanelWithAgent: (agentType: AiAgentTypeEnum) => void
  startNewConversation: ({ convId, message }: { convId: string; message: string }) => void
  setPreviousChatMessages: ({
    convId,
    messages,
  }: {
    convId: string
    messages: ChatMessage[]
  }) => void
  streamChunk: ({ messageId, chunk }: { messageId: string; chunk: string }) => void
  setChatDone: (messageId: string) => void
  addNewMessage: (message: string, exchangeId?: string) => void
  completeExchange: ({
    exchangeId,
    response,
    sessionId,
    financeAssistantResult,
  }: {
    exchangeId: string
    response: string
    sessionId?: string
    financeAssistantResult?: FinanceAssistantResult
  }) => void
  failExchange: (exchangeId: string) => void
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
  const [agentType, setAgentTypeState] = useState<AiAgentTypeEnum>(AiAgentTypeEnum.billing)

  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    isLoading: false,
    isStreaming: false,
    hasError: false,
    financeSessionId: undefined,
  })

  const lastAssistantMessage = useMemo(() => {
    return state.messages.filter((message) => message.role === ChatRole.assistant).pop()
  }, [state.messages])

  const setPreviousChatMessages = ({
    convId,
    messages,
  }: {
    convId: string
    messages: ChatMessage[]
  }) => {
    // History only stores billing conversations; replies must route to the billing flow
    setAgentTypeState(AiAgentTypeEnum.billing)
    setConversationId(convId)
    dispatch({ type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES, messages })
  }

  const setAgentType = (newAgentType: AiAgentTypeEnum) => {
    if (agentType === newAgentType) return

    setConversationId('')
    setAgentTypeState(newAgentType)
    dispatch({ type: ChatActionType.RESET_CONVERSATION })
  }

  const openPanelWithAgent = (newAgentType: AiAgentTypeEnum) => {
    setAgentType(newAgentType)
    panel.openPanel(AIPanelEnum.ai)
  }

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

  // Scroll to the bottom of the conversation container
  const scrollConversationToBottom = () => {
    setTimeout(() => {
      const containerElement = document.querySelector(
        '[data-id="conversation-container"]',
      ) as HTMLElement

      if (containerElement) {
        containerElement.scrollTo({ top: containerElement.scrollHeight })
      }
    }, 0)
  }

  const addNewMessage = (message: string, exchangeId?: string) => {
    dispatch({ type: ChatActionType.ADD_INPUT, message, exchangeId })
    scrollConversationToBottom()
  }

  const completeExchange = ({
    exchangeId,
    response,
    sessionId,
    financeAssistantResult,
  }: {
    exchangeId: string
    response: string
    sessionId?: string
    financeAssistantResult?: FinanceAssistantResult
  }) => {
    dispatch({
      type: ChatActionType.COMPLETE_EXCHANGE,
      exchangeId,
      response,
      sessionId,
      financeAssistantResult,
    })
    scrollConversationToBottom()
  }

  const failExchange = (exchangeId: string) => {
    dispatch({ type: ChatActionType.FAIL_EXCHANGE, exchangeId })
  }

  return (
    <AiAgentContext.Provider
      value={{
        ...panel,
        state,
        conversationId,
        agentType,
        lastAssistantMessage,
        setAgentType,
        openPanelWithAgent,
        startNewConversation,
        setPreviousChatMessages,
        resetConversation,
        streamChunk,
        setChatDone,
        addNewMessage,
        completeExchange,
        failExchange,
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
