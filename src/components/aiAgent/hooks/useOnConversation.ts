import { gql } from '@apollo/client'

import {
  AiConversationToolCallItemFragment,
  LagoApiError,
  OnConversationSubscriptionHookResult,
  useOnConversationSubscription,
} from '~/generated/graphql'

gql`
  subscription onConversation($id: ID!) {
    aiConversationStreamed(id: $id) {
      chunk
      done
      pendingToolCalls {
        ...AiConversationToolCallItem
      }
    }
  }
`

type UseOnConversationProps = {
  conversationId: string | undefined
  onPendingToolCalls: (toolCalls: AiConversationToolCallItemFragment[]) => void
}

export const useOnConversation = ({
  conversationId,
  onPendingToolCalls,
}: UseOnConversationProps): OnConversationSubscriptionHookResult => {
  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: {
      id: conversationId ?? '',
    },
    fetchPolicy: 'no-cache',
    context: { silentErrorCodes: [LagoApiError.TokenExpired] },
    // Read on every event: `data` only keeps the latest one, and missing it would hide writes to confirm
    onData: ({ data }) => {
      const pendingToolCalls = data.data?.aiConversationStreamed.pendingToolCalls

      if (pendingToolCalls?.length) onPendingToolCalls(pendingToolCalls)
    },
  })

  return subscription
}
