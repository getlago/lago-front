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
  onChunk: (chunk: string) => void
  onDone: () => void
}

export const useOnConversation = ({ conversationId, onChunk, onDone }: UseOnConversationProps) => {
  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: {
      id: conversationId ?? '',
    },
    fetchPolicy: 'no-cache',
    context: { silentErrorCodes: [LagoApiError.TokenExpired] },
    // Handle every event as it arrives: reading the latest `data` in an effect drops a chunk
    // equal to the previous one (two line breaks in a row) and chunks batched into one render.
    onData: ({ data }) => {
      const event = data.data?.aiConversationStreamed

      if (!event) return
      if (event.chunk) onChunk(event.chunk)
      if (event.done) onDone()
    },
  })

  return subscription
}
