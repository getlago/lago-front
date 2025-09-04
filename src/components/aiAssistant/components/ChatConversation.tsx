import { gql } from '@apollo/client'
import { FC, useEffect, useState } from 'react'

import { ChatMessages } from '~/components/aiAssistant/components/ChatElements'
import { useCustomLLMOutput } from '~/components/aiAssistant/components/llmOutput'
import { useOnConversationSubscription } from '~/generated/graphql'
import { useAiAgentTool } from '~/hooks/aiAgent/useAiAgent'

gql`
  subscription onConversation($id: ID!) {
    aiConversationStreamed(id: $id) {
      chunk
      done
    }
  }
`

export const ChatConversation: FC = () => {
  const [output, setOutput] = useState('')
  const [isStreamFinished, setIsStreamFinished] = useState(false)
  const { conversationId, message } = useAiAgentTool()

  const blockMatches = useCustomLLMOutput(output, isStreamFinished)

  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: { id: conversationId ?? '' },
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    if (subscription.data?.aiConversationStreamed.chunk) {
      setOutput((prev) => prev + subscription.data?.aiConversationStreamed.chunk)
    }
  }, [subscription.data?.aiConversationStreamed.chunk])

  useEffect(() => {
    if (subscription.data?.aiConversationStreamed.done) {
      setIsStreamFinished(true)
    }
  }, [subscription.data?.aiConversationStreamed.done])

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto">
      <ChatMessages.Sent>{message}</ChatMessages.Sent>

      {subscription.loading && <ChatMessages.Loading />}

      {subscription.error ? (
        <ChatMessages.Error>{`There was an error generating a response.`}</ChatMessages.Error>
      ) : (
        blockMatches.map((blockMatch, index) => {
          const Component = blockMatch.block.component

          return <Component key={index} blockMatch={blockMatch} />
        })
      )}
    </div>
  )
}
