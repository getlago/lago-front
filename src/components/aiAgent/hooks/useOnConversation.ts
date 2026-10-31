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
    // onData, not an effect on data: data only keeps the latest event
    onData: ({ data }) => {
      const pendingToolCalls = data.data?.aiConversationStreamed.pendingToolCalls

      if (pendingToolCalls?.length) onPendingToolCalls(pendingToolCalls)
    },
  })

  return subscription
}
