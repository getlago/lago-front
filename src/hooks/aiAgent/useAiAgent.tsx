import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
} from 'react'

import { useLocation } from '~/core/router'
import { getItemFromLS, setItemFromLS } from '~/core/utils/localStorage'
import {
  ChatActionType,
  ChatMessage,
  chatReducer,
  ChatRole,
  ChatState,
  createChatSession,
  FinanceAssistantResult,
} from '~/hooks/aiAgent/aiAgentReducer'
import { usePanel, UsePanelReturn } from '~/hooks/ui/usePanel'
import { useCurrentUser } from '~/hooks/useCurrentUser'

export enum AIPanelEnum {
  ai = 'ai',
}

export enum AiAgentTypeEnum {
  finance = 'finance',
  billing = 'billing',
}

export const AGENT_TYPE_LABELS: Record<AiAgentTypeEnum, string> = {
  [AiAgentTypeEnum.billing]: 'text_1780562979519nd49yg82e20',
  [AiAgentTypeEnum.finance]: 'text_17805629795197990fik8a0f',
}

export const AGENT_TYPE_SHOW_HISTORY: Record<AiAgentTypeEnum, boolean> = {
  [AiAgentTypeEnum.billing]: true,
  [AiAgentTypeEnum.finance]: false,
}

export const AI_AGENT_TYPE_LS_KEY = 'aiAgentType'

const getStoredAgentType = (): AiAgentTypeEnum => {
  const stored = getItemFromLS(AI_AGENT_TYPE_LS_KEY)

  return Object.values(AiAgentTypeEnum).includes(stored as AiAgentTypeEnum)
    ? (stored as AiAgentTypeEnum)
    : AiAgentTypeEnum.finance
}

interface AiAgentContextType extends UsePanelReturn<AIPanelEnum> {
  state: ChatState
  conversationId?: string
  agentType: AiAgentTypeEnum
  lastAssistantMessage?: ChatMessage
  setAgentType: (agentType: AiAgentTypeEnum) => void
  openPanelWithAgent: (agentType: AiAgentTypeEnum) => void
  startRestore: (restoreId: string) => void
  setPreviousChatMessages: ({
    restoreId,
    conversationId,
    messages,
  }: {
    restoreId: string
    conversationId: string
    messages: ChatMessage[]
  }) => void
  streamChunk: ({ messageId, chunk }: { messageId: string; chunk: string }) => void
  setChatDone: (messageId: string) => void
  addNewMessage: (message: string, exchangeId: string) => void
  confirmExchange: ({
    exchangeId,
    conversationId,
  }: {
    exchangeId: string
    conversationId: string
  }) => void
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

const AiAgentContext = createContext<AiAgentContextType | undefined>(undefined)

export const PANEL_OPEN = 33
export const PANEL_CLOSED = 0

export function AiAgentProvider({ children }: { children: ReactNode }) {
  const panel = usePanel<AIPanelEnum>({
    size: {
      open: PANEL_OPEN,
      closed: PANEL_CLOSED,
    },
  })

  const { currentUser } = useCurrentUser()
  const { pathname } = useLocation()
  const [agentType, setAgentTypeState] = useState<AiAgentTypeEnum>(getStoredAgentType)
  const [state, dispatch] = useReducer(chatReducer, null, () => createChatSession(null))

  // Outside `<Routes>`, so `useParams()` carries no slug; never
  // `currentOrganizationVar`, which answers with another tab's organization.
  const slugFromPath = pathname.split('/')[1] ?? ''
  const organizationId = currentUser?.memberships?.find(
    (membership) => membership.organization.slug === slugFromPath,
  )?.organization.id

  // Renaming the slug keeps the conversation; another user or organization drops
  // it. `null` off an organization route, where the session must not churn.
  const scopeKey = organizationId ? `${currentUser?.id ?? ''}:${organizationId}` : null

  // During render, not in an effect: an effect paints one frame of the previous
  // scope's conversation before clearing it.
  if (scopeKey !== null && scopeKey !== state.scopeKey) {
    dispatch({ type: ChatActionType.SET_SCOPE, scopeKey })
  }

  const lastAssistantMessage = useMemo(() => {
    return state.messages.filter((message) => message.role === ChatRole.assistant).pop()
  }, [state.messages])

  const startRestore = useCallback((restoreId: string) => {
    dispatch({ type: ChatActionType.START_RESTORE, restoreId })
  }, [])

  const setPreviousChatMessages = ({
    restoreId,
    conversationId,
    messages,
  }: {
    restoreId: string
    conversationId: string
    messages: ChatMessage[]
  }) => {
    // History only stores billing conversations; replies must route to the billing flow
    setAgentTypeState(AiAgentTypeEnum.billing)
    dispatch({
      type: ChatActionType.SET_PREVIOUS_CHAT_MESSAGES,
      restoreId,
      conversationId,
      messages,
    })
  }

  const setAgentType = (newAgentType: AiAgentTypeEnum) => {
    if (agentType === newAgentType) return

    setAgentTypeState(newAgentType)
    setItemFromLS(AI_AGENT_TYPE_LS_KEY, newAgentType)
    dispatch({ type: ChatActionType.RESET_CONVERSATION })
  }

  const openPanelWithAgent = (newAgentType: AiAgentTypeEnum) => {
    setAgentType(newAgentType)
    panel.openPanel(AIPanelEnum.ai)
  }

  const resetConversation = useCallback(() => {
    dispatch({ type: ChatActionType.RESET_CONVERSATION })
  }, [])

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

  const addNewMessage = (message: string, exchangeId: string) => {
    dispatch({ type: ChatActionType.ADD_INPUT, message, exchangeId })
    scrollConversationToBottom()
  }

  const confirmExchange = ({
    exchangeId,
    conversationId,
  }: {
    exchangeId: string
    conversationId: string
  }) => {
    dispatch({ type: ChatActionType.CONFIRM_EXCHANGE, exchangeId, conversationId })
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
        conversationId: state.conversationId,
        agentType,
        lastAssistantMessage,
        setAgentType,
        openPanelWithAgent,
        startRestore,
        setPreviousChatMessages,
        resetConversation,
        streamChunk,
        setChatDone,
        addNewMessage,
        confirmExchange,
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
