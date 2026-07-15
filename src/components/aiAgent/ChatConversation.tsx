import { FC, useEffect } from 'react'

import { ChatMessages } from '~/components/aiAgent/ChatMessages'
import { Message } from '~/components/aiAgent/llmOutputs'
import { OnConversationSubscriptionHookResult } from '~/generated/graphql'
import { ChatRole } from '~/hooks/aiAgent/aiAgentReducer'
import { useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CHAT_CONVERSATION_TEST_ID = 'chat-conversation'

interface ChatConversationProps {
  subscription: OnConversationSubscriptionHookResult
}

export const ChatConversation: FC<ChatConversationProps> = ({ subscription }) => {
  const { agentType, lastAssistantMessage, state, setChatDone, streamChunk } = useAiAgent()
  const { translate } = useInternationalization()

  useEffect(() => {
    if (subscription.data?.aiConversationStreamed.chunk) {
      if (lastAssistantMessage) {
        streamChunk({
          messageId: lastAssistantMessage.id,
          chunk: subscription.data.aiConversationStreamed.chunk,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription.data?.aiConversationStreamed.chunk])

  useEffect(() => {
    if (lastAssistantMessage && subscription.data?.aiConversationStreamed.done) {
      setChatDone(lastAssistantMessage.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription.data?.aiConversationStreamed.done])

  return (
    <div
      data-id="conversation-container"
      data-test={CHAT_CONVERSATION_TEST_ID}
      className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-6"
    >
      {state.messages.map((message) => {
        if (message.role === ChatRole.user) {
          return (
            <ChatMessages.Sent key={message.id}>
              <Message message={message} />
            </ChatMessages.Sent>
          )
        }

        // Skip the assistant bubble while it has nothing to render yet — the
        // loader stands in for the pending reply. An empty Received element
        // would otherwise stack a second gap-6 above the loader.
        if (!message.message && !message.financeAssistantResult) {
          return null
        }

        return (
          <ChatMessages.Received key={message.id}>
            <Message message={message} />
          </ChatMessages.Received>
        )
      })}

      {state.isLoading && <ChatMessages.Loading agentType={agentType} />}

      {(subscription.error || state.hasError) && (
        <ChatMessages.Error>{translate('text_1757417225851jw88w0yfa0n')}</ChatMessages.Error>
      )}
    </div>
  )
}
