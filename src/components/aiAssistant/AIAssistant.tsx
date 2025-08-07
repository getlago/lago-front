import { gql } from '@apollo/client'
import { Button } from 'lago-design-system'
import { useState } from 'react'

import { useCreateAiConversationMutation, useOnConversationSubscription } from '~/generated/graphql'

gql`
  subscription onConversation($conversationId: ID!) {
    aiConversationStreamed(conversationId: $conversationId) {
      id
      conversationId
      inputData
      organization {
        id
      }
      updatedAt
    }
  }

  mutation createAiConversation($input: CreateAiConversationInput!) {
    createAiConversation(input: $input) {
      conversationId
      inputData
    }
  }
`

export const AIAssistant = () => {
  const [conversationId, setConversationId] = useState<string | null>(null)

  const [createAiConversation, { loading: mutationLoading, error: mutationError }] =
    useCreateAiConversationMutation()

  const handleCreateAiConversation = async () => {
    try {
      await createAiConversation({
        variables: { input: { inputData: 'Hello, how are you?' } },

        onCompleted: (data) => {
          if (data.createAiConversation) {
            setConversationId(data.createAiConversation.conversationId)
          }
        },
      })
    } catch {
      // Handle error silently or log to monitoring service
    }
  }

  const { data: subscriptionData, error: subscriptionError } = useOnConversationSubscription({
    variables: { conversationId: conversationId ?? '' },
    skip: !conversationId,
  })

  console.log(conversationId, subscriptionData)

  return (
    <div>
      <Button onClick={handleCreateAiConversation} disabled={mutationLoading}>
        {mutationLoading ? 'Creating...' : 'Create AI Conversation'}
      </Button>

      {mutationError && <div className="mt-4 text-red-500">Error: {mutationError.message}</div>}

      {subscriptionError && (
        <div className="mt-4 text-red-500">Subscription Error: {subscriptionError.message}</div>
      )}

      {subscriptionData && (
        <div className="mt-4">
          <h3>Conversation Data:</h3>
          <pre>{JSON.stringify(subscriptionData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
