import { gql } from '@apollo/client'
import { Typography } from 'lago-design-system'

import { ChatConversation } from '~/components/aiAgent/ChatConversation'
import { ChatHistory } from '~/components/aiAgent/ChatHistory'
import { ChatPromptEditor } from '~/components/aiAgent/ChatPromptEditor'
import { ChatShortcuts } from '~/components/aiAgent/ChatShortcuts'
import {
  CreateAiConversationInput,
  useCreateAiConversationMutation,
  useOnConversationSubscription,
} from '~/generated/graphql'
import { useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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

export const PanelAiAgent = () => {
  const { conversationId, state, startNewConversation, addNewMessage } = useAiAgent()
  const [createAiConversation, { loading, error }] = useCreateAiConversationMutation()
  const { translate } = useInternationalization()

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
          }
        }
      },
    })
  }

  const shouldDisplayWelcomeMessage = !state.messages.length && !loading && !error

  return (
    <div className="flex h-full flex-col">
      {shouldDisplayWelcomeMessage && (
        <div className="mb-4 mt-auto flex flex-col gap-4 px-4">
          <Typography variant="headline" color="grey700">
            {translate('text_1757417225851l83ffyzwk4g')}
          </Typography>
          <Typography variant="body" color="grey500">
            {translate('text_1757417225851ylz6l7fwrg9')}
          </Typography>

          <ChatShortcuts onSubmit={handleSubmit} />
        </div>
      )}

      {!!state.messages.length && <ChatConversation subscription={subscription} />}

      <ChatPromptEditor onSubmit={handleSubmit} />

      {!state.messages.length && <ChatHistory />}
    </div>
  )
}
