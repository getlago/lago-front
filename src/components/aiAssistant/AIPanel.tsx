import { gql } from '@apollo/client'
import { Typography } from 'lago-design-system'

import { ChatConversation } from '~/components/aiAssistant/components/ChatConversation'
import { ChatHistory } from '~/components/aiAssistant/components/ChatHistory'
import { ChatPromptEditor } from '~/components/aiAssistant/components/ChatPromptEditor'
import { ChatShortcut } from '~/components/aiAssistant/components/ChatShortcut'
import { CreateAiConversationInput, useCreateAiConversationMutation } from '~/generated/graphql'
import { useAiAgentTool } from '~/hooks/aiAgent/useAiAgent'

gql`
  mutation createAiConversation($input: CreateAiConversationInput!) {
    createAiConversation(input: $input) {
      id
      name
    }
  }
`

export const AIPanel = () => {
  const { message, startNewConversation, conversationId } = useAiAgentTool()

  const [createAiConversation, { loading, error }] = useCreateAiConversationMutation()

  const handleSubmit = async (values: CreateAiConversationInput) => {
    await createAiConversation({
      variables: {
        input: {
          message: values.message,
          conversationId: conversationId,
        },
      },

      onCompleted: (data) => {
        if (!!data.createAiConversation?.id) {
          startNewConversation({
            id: data.createAiConversation.id,
            message: values.message,
          })
        }
      },
    })
  }

  const shouldDisplayWelcomeMessage = !message && !loading && !error

  return (
    <div className="flex h-full flex-col gap-4">
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

      {message && <ChatConversation />}

      <ChatPromptEditor onSubmit={handleSubmit} />

      {!message && <ChatHistory />}
    </div>
  )
}
