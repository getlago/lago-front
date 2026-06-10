import { useEffect, useRef, useState } from 'react'

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

type PanelAiAgentProps = {
  hasAccessToAiAgent: boolean
}

export const PanelAiAgent = ({ hasAccessToAiAgent }: PanelAiAgentProps) => {
  const { addNewMessage, agentType, conversationId, startNewConversation, state } = useAiAgent()
  const { createAiConversation, loading, error } = useCreateAiConversation()
  const { submitFinanceQuestion } = useAskFinanceAssistant()
  const [initialPrompt, setInitialPrompt] = useState<string>('')
  const { translate } = useInternationalization()
  const isFinanceAssistant = agentType === AiAgentTypeEnum.finance

  // Late async completions must check the agent selected *now*, not the one
  // captured when the request started
  const agentTypeRef = useRef(agentType)

  agentTypeRef.current = agentType

  const subscription = useOnConversation({
    conversationId: isFinanceAssistant ? undefined : conversationId,
  })

  useEffect(() => {
    setInitialPrompt('')
  }, [agentType])

  const handleSubmit = async (values: CreateAiConversationInput) => {
    if (isFinanceAssistant) {
      return submitFinanceQuestion(values.message)
    }

    setInitialPrompt(values.message)

    await createAiConversation({
      variables: {
        input: {
          message: values.message,
          conversationId: conversationId || undefined,
        },
      },

      onCompleted: (data) => {
        // The user switched agents while the request was in flight
        if (agentTypeRef.current !== AiAgentTypeEnum.billing) {
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
  }

  const shouldDisplayWelcomeMessage = !state.messages.length && !loading && !error

  return (
    <div className="flex h-full flex-col bg-grey-100 shadow-l">
      {shouldDisplayWelcomeMessage && (
        <div className="mb-6 mt-auto flex flex-col gap-6 px-6">
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
        <div className="p-6 pt-0">
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
        <div className="mt-auto flex h-full flex-col gap-12 p-6">
          <ChatMessages.Sent>{initialPrompt}</ChatMessages.Sent>

          <ChatMessages.Loading />
        </div>
      )}

      {!state.messages.length && error && (
        <div className="mt-auto flex h-full flex-col gap-6 p-6">
          {!!initialPrompt && <ChatMessages.Sent>{initialPrompt}</ChatMessages.Sent>}

          <ChatMessages.Error>{translate('text_1757417225851jw88w0yfa0n')}</ChatMessages.Error>
        </div>
      )}

      {!!state.messages.length && <ChatConversation subscription={subscription} />}

      <ChatPromptEditor disabled={!hasAccessToAiAgent} onSubmit={handleSubmit} />
    </div>
  )
}
