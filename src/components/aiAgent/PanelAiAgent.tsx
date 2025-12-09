import { gql } from '@apollo/client'
import { useState } from 'react'

import { ChatConversation } from '~/components/aiAgent/ChatConversation'
import { ChatMessages } from '~/components/aiAgent/ChatMessages'
import { ChatPromptEditor } from '~/components/aiAgent/ChatPromptEditor'
import { ChatShortcuts } from '~/components/aiAgent/ChatShortcuts'
import { Typography } from '~/components/designSystem'
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
  const [initialPrompt, setInitialPrompt] = useState<string>('')
  const { translate } = useInternationalization()

  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: {
      id: conversationId ?? '',
    },
    fetchPolicy: 'no-cache',
  })

  const handleSubmit = async (values: CreateAiConversationInput) => {
    setInitialPrompt(values.message)

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
    <div className="flex h-full flex-col bg-grey-100 shadow-l">
      {shouldDisplayWelcomeMessage && (
        <div className="mb-6 mt-auto flex flex-col gap-6 px-6">
          <div className="flex flex-col gap-1">
            <Typography variant="headline" color="grey700">
              {translate('text_1757417225851l83ffyzwk4g')}
            </Typography>
            <Typography variant="body" color="grey600">
              {translate('text_1757417225851ylz6l7fwrg9')}
            </Typography>
          </div>

          <ChatShortcuts onSubmit={handleSubmit} />
        </div>
      )}

      {!shouldDisplayWelcomeMessage && !state.messages.length && initialPrompt && (
        <div className="mt-auto flex h-full flex-col gap-12 p-6">
          <ChatMessages.Sent>{initialPrompt}</ChatMessages.Sent>

          <ChatMessages.Loading />
        </div>
      )}

      {!!state.messages.length && <ChatConversation subscription={subscription} />}

      <ChatPromptEditor onSubmit={handleSubmit} />
    </div>
  )
}
