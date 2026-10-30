import { tw } from 'lago-design-system'
import { useRef, useState } from 'react'

import { ChatConversation } from '~/components/aiAgent/ChatConversation'
import { ChatMessages } from '~/components/aiAgent/ChatMessages'
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
export const PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID = 'panel-ai-agent-initial-prompt'

export const PANEL_AI_AGENT_ERROR_TEST_ID = 'panel-ai-agent-error'

type PanelAiAgentProps = {
  hasAccessToAiAgent: boolean
  isFullscreen?: boolean
}

export const PanelAiAgent = ({ hasAccessToAiAgent, isFullscreen }: PanelAiAgentProps) => {
  const {
    addNewMessage,
    agentType,
    conversationId,
    getConversationVersion,
    startNewConversation,
    state,
  } = useAiAgent()
  const { createAiConversation, loading, error } = useCreateAiConversation()
  const { submitFinanceQuestion } = useAskFinanceAssistant()
  const isSubmittingRef = useRef(false)
  const [initialPrompt, setInitialPrompt] = useState<string>('')
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
    setInitialPrompt(values.message)

    const versionAtSubmit = getConversationVersion()

    try {
      await createAiConversation({
        variables: {
          input: {
            message: values.message,
            conversationId: conversationId || undefined,
          },
        },

        onCompleted: (data) => {
          // The conversation was dropped or replaced while the request was in
          // flight: organization switch, agent switch, restored history
          if (getConversationVersion() !== versionAtSubmit) {
            return
          }

          if (conversationId) {
            addNewMessage(values.message)

            return subscription.restart()
          }

          if (!data.createAiConversation?.id) {
            return
          }

          return startNewConversation({
            convId: data.createAiConversation.id,
            message: values.message,
          })
        },
      })
    } finally {
      isSubmittingRef.current = false
    }
  }

  const shouldDisplayWelcomeMessage = !state.messages.length && !loading && !error

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

      {!shouldDisplayWelcomeMessage && !state.messages.length && initialPrompt && !error && (
        <div
          className="mt-auto flex h-full flex-col gap-6 p-6"
          data-test={PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID}
        >
          <ChatMessages.Sent>{initialPrompt}</ChatMessages.Sent>

          <ChatMessages.Loading agentType={agentType} />
        </div>
      )}

      {!state.messages.length && error && (
        <div
          className="mt-auto flex h-full flex-col gap-6 p-6"
          data-test={PANEL_AI_AGENT_ERROR_TEST_ID}
        >
          {!!initialPrompt && <ChatMessages.Sent>{initialPrompt}</ChatMessages.Sent>}

          <ChatMessages.Error>{translate('text_1757417225851jw88w0yfa0n')}</ChatMessages.Error>
        </div>
      )}

      {!!state.messages.length && <ChatConversation subscription={subscription} />}

      <ChatPromptEditor disabled={!hasAccessToAiAgent || loading} onSubmit={handleSubmit} />
    </div>
  )
}
