import { gql } from '@apollo/client'

import { LagoApiError, useOnConversationSubscription } from '~/generated/graphql'

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

export const useOnConversation = ({ conversationId }: UseOnConversationProps) => {
  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: {
      id: conversationId ?? '',
    },
    fetchPolicy: 'no-cache',
    // The API ends the stream with token_expired once the socket token has expired. It is not a
    // logout, and the chat shows the error, so it is kept out of Sentry.
    context: { silentErrorCodes: [LagoApiError.TokenExpired] },
  })

  return subscription
}
