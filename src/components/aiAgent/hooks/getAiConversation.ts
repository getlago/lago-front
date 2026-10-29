import { gql } from '@apollo/client'

import { useGetAiConversationLazyQuery } from '~/generated/graphql'

gql`
  query getAiConversation($id: ID!) {
    aiConversation(id: $id) {
      id
      name
      messages {
        content
        type
      }
      pendingToolCalls {
        ...AiConversationToolCallItem
      }
      busy
    }
  }
`

export const useGetAiConversation = () => {
  const [getAiConversation] = useGetAiConversationLazyQuery()

  return {
    getAiConversation,
  }
}
