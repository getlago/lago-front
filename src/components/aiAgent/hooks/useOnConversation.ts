import { gql } from '@apollo/client'

import { LagoApiError, useOnConversationSubscription } from '~/generated/graphql'

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
}

export const useOnConversation = ({ conversationId }: UseOnConversationProps) => {
  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: {
      id: conversationId ?? '',
    },
    fetchPolicy: 'no-cache',
    context: { silentErrorCodes: [LagoApiError.TokenExpired] },
  })

  return subscription
}
