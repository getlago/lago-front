import { gql } from '@apollo/client'
import { Typography } from 'lago-design-system'

import { ChatConversation } from '~/components/aiAssistant/components/ChatConversation'
import { ChatHistory } from '~/components/aiAssistant/components/ChatHistory'
import { ChatPromptEditor } from '~/components/aiAssistant/components/ChatPromptEditor'
import { ChatShortcut } from '~/components/aiAssistant/components/ChatShortcut'
import {
  CreateAiConversationInput,
  useCreateAiConversationMutation,
  useOnConversationSubscription,
} from '~/generated/graphql'
import { useAiAgentTool } from '~/hooks/aiAgent/useAiAgent'

gql`
  mutation createAiConversation($input: CreateAiConversationInput!) {
    createAiConversation(input: $input) {
      id
      name
    }
  }

  subscription onConversation($id: ID!) {
    aiConversationStreamed(id: $id) {
      chunk
      done
    }
  }
`

export const AIPanel = () => {
  const { conversationId, state, startNewConversation, addNewMessage, addNewOutput } =
    useAiAgentTool()
  const [createAiConversation, { loading, error }] = useCreateAiConversationMutation()

  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: {
      id: conversationId ?? '',
    },
    fetchPolicy: 'no-cache',
  })

  const handleSubmit = async (values: CreateAiConversationInput) => {
    await createAiConversation({
      variables: {
        input: {
          message: values.message,
          conversationId: conversationId || undefined,
        },
      },

      onCompleted: (data) => {
        if (conversationId) {
          addNewMessage(values.message)
          subscription.restart()
        } else {
          if (!!data.createAiConversation?.id) {
            startNewConversation({
              convId: data.createAiConversation.id,
              message: values.message,
            })
            addNewOutput()
          }
        }
      },
    })
  }

  const shouldDisplayWelcomeMessage = !state.messages.length && !loading && !error

  return (
    <div className="flex h-full flex-col">
      {shouldDisplayWelcomeMessage && (
        <div className="mb-8 mt-auto flex flex-col gap-4 px-4">
          <Typography variant="headline" color="grey700">
            Need insights or actions on your billing data?
          </Typography>
          <Typography variant="body" color="grey500">
            I’m here to help you move faster
          </Typography>

          <ChatShortcut />
        </div>
      )}

      {!!state.messages.length && <ChatConversation subscription={subscription} />}

      <ChatPromptEditor onSubmit={handleSubmit} />

      {!state.messages.length && <ChatHistory />}
    </div>
  )
}
