import { tw } from 'lago-design-system'
import { useRef } from 'react'

import { ChatConversation } from '~/components/aiAgent/ChatConversation'
import { ChatPromptEditor } from '~/components/aiAgent/ChatPromptEditor'
import { ChatShortcuts } from '~/components/aiAgent/ChatShortcuts'
import { useAskFinanceAssistant } from '~/components/aiAgent/hooks/useAskFinanceAssistant'
import { useCreateAiConversation } from '~/components/aiAgent/hooks/useCreateAiConversation'
import { useOnConversation } from '~/components/aiAgent/hooks/useOnConversation'
import { Typography } from '~/components/designSystem/Typography'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { CreateAiConversationInput } from '~/generated/graphql'
import { AiAgentTypeEnum, useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PANEL_AI_AGENT_WELCOME_TEST_ID = 'panel-ai-agent-welcome'
export const PANEL_AI_AGENT_PREMIUM_BLOCK_TEST_ID = 'panel-ai-agent-premium-block'
type PanelAiAgentProps = {
  hasAccessToAiAgent: boolean
  isFullscreen?: boolean
}

export const PanelAiAgent = ({ hasAccessToAiAgent, isFullscreen }: PanelAiAgentProps) => {
  const { addNewMessage, agentType, confirmExchange, conversationId, failExchange, state } =
    useAiAgent()
  const { createAiConversation, loading } = useCreateAiConversation()
  const { submitFinanceQuestion } = useAskFinanceAssistant()
  const isSubmittingRef = useRef(false)
  const { translate } = useInternationalization()
  const isFinanceAssistant = agentType === AiAgentTypeEnum.finance

  const subscription = useOnConversation({
    conversationId: isFinanceAssistant ? undefined : conversationId,
  })

  const handleSubmit = async (values: CreateAiConversationInput): Promise<void> => {
    if (isSubmittingRef.current) return

    if (isFinanceAssistant) {
      return submitFinanceQuestion(values.message)
    }

    isSubmittingRef.current = true

    const exchangeId = crypto.randomUUID()
    const conversationIdAtSubmit = conversationId

    addNewMessage(values.message, exchangeId)

    try {
      const { data } = await createAiConversation({
        variables: {
          input: {
            message: values.message,
            conversationId: conversationIdAtSubmit || undefined,
          },
        },
      })

      const acceptedConversationId = data?.createAiConversation?.id

      if (!acceptedConversationId) {
        return failExchange(exchangeId)
      }

      // Dropped when the exchange is no longer pending: the session was reset,
      // replaced by a restore, or belongs to a scope the tab has left.
      confirmExchange({ exchangeId, conversationId: acceptedConversationId })

      // A follow-up reuses a live subscription, which only replays from the
      // moment it (re)connects.
      if (conversationIdAtSubmit) {
        subscription.restart()
      }
    } catch {
      failExchange(exchangeId)
    } finally {
      isSubmittingRef.current = false
    }
  }

  const shouldDisplayWelcomeMessage = !state.messages.length

  return (
    <div className={tw('flex h-full flex-col bg-grey-100', !isFullscreen && 'shadow-l')}>
      {shouldDisplayWelcomeMessage && (
        <div
          className="mb-6 mt-auto flex flex-col gap-6 px-6"
          data-test={PANEL_AI_AGENT_WELCOME_TEST_ID}
        >
          <div className="flex flex-col gap-1">
            <Typography variant="headline" color="grey700">
              {isFinanceAssistant
                ? translate('text_1780562979519a6i8bacevvs')
                : translate('text_1757417225851l83ffyzwk4g')}
            </Typography>
            <Typography variant="body" color="grey600">
              {translate('text_1757417225851ylz6l7fwrg9')}
            </Typography>
          </div>

          {hasAccessToAiAgent && <ChatShortcuts agentType={agentType} onSubmit={handleSubmit} />}
        </div>
      )}

      {!hasAccessToAiAgent && (
        <div className="p-6 pt-0" data-test={PANEL_AI_AGENT_PREMIUM_BLOCK_TEST_ID}>
          <PremiumFeature
            title={translate('text_1765530128923vobffyisvq9')}
            description={translate('text_176553012892493ck00lv7qj')}
            feature="Lago AI Agent"
            className="flex-col border border-grey-300 bg-white"
            buttonClassName="self-end"
          />
        </div>
      )}

      {!!state.messages.length && <ChatConversation subscription={subscription} />}

      <ChatPromptEditor disabled={!hasAccessToAiAgent || loading} onSubmit={handleSubmit} />
    </div>
  )
}
