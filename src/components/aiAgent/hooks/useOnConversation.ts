import { gql } from '@apollo/client'

import {
  OnConversationSubscriptionHookResult,
  useOnConversationSubscription,
} from '~/generated/graphql'
import { ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'
import { useAiAgent } from '~/hooks/aiAgent/useAiAgent'

gql`
  subscription onConversation($id: ID!) {
    aiConversationStreamed(id: $id) {
      chunk
      done
    }
  }
`

type UseOnConversationProps = {
  conversationId: string | undefined
}

export const useOnConversation = ({
  conversationId,
}: UseOnConversationProps): OnConversationSubscriptionHookResult => {
  const { lastAssistantMessage, streamChunk, setChatDone } = useAiAgent()
  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: {
      id: conversationId ?? '',
    },
    fetchPolicy: 'no-cache',
    onData: ({ data }) => {
      const event = data.data?.aiConversationStreamed

      if (
        !conversationId ||
        data.variables?.id !== conversationId ||
        !event ||
        !lastAssistantMessage ||
        lastAssistantMessage.status === ChatStatus.done
      ) {
        return
      }

      if (event.chunk) {
        streamChunk({ messageId: lastAssistantMessage.id, chunk: event.chunk })
      }

      if (event.done) {
        setChatDone(lastAssistantMessage.id)
      }
    },
  })

  return subscription
}
