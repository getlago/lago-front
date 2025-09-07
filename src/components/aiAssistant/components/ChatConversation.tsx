import { FC, useEffect } from 'react'

import { ChatMessages } from '~/components/aiAssistant/components/ChatElements'
import { Message } from '~/components/aiAssistant/components/llmOutput/Message'
import { OnConversationSubscriptionHookResult } from '~/generated/graphql'
import { ChatRole } from '~/hooks/aiAgent/aiAgentReducer'
import { useAiAgentTool } from '~/hooks/aiAgent/useAiAgent'

interface ChatConversationProps {
  subscription: OnConversationSubscriptionHookResult
}

export const ChatConversation: FC<ChatConversationProps> = ({ subscription }) => {
  const { lastAssistantMessage, state, setChatDone, streamChunk } = useAiAgentTool()

  useEffect(() => {
    if (subscription.data?.aiConversationStreamed.chunk) {
      if (lastAssistantMessage) {
        streamChunk({
          messageId: lastAssistantMessage.id,
          chunk: subscription.data.aiConversationStreamed.chunk,
        })
      }
    }
  }, [subscription.data?.aiConversationStreamed.chunk])

  useEffect(() => {
    if (lastAssistantMessage && subscription.data?.aiConversationStreamed.done) {
      setChatDone(lastAssistantMessage.id)
    }
  }, [subscription.data?.aiConversationStreamed.done])

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto p-4">
      {state.messages.map((message) => {
        if (message.role === ChatRole.user) {
          return (
            <ChatMessages.Sent key={message.id}>
              <Message message={message} />
            </ChatMessages.Sent>
          )
        }

        return (
          <ChatMessages.Received key={message.id}>
            <Message message={message} />
          </ChatMessages.Received>
        )
      })}

      {subscription.loading && <ChatMessages.Loading />}

      {subscription.error && (
        <ChatMessages.Error>{`There was an error generating a response.`}</ChatMessages.Error>
      )}
    </div>
  )
}
