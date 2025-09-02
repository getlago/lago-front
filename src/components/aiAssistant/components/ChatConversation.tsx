import { gql } from '@apollo/client'
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code'
import { markdownLookBack } from '@llm-ui/markdown'
import { throttleBasic, useLLMOutput } from '@llm-ui/react'
import { FC, useEffect, useState } from 'react'

import { CodeBlock } from '~/components/aiAssistant/CodeBlock'
import { ChatMessages } from '~/components/aiAssistant/components/ChatElements'
import { MarkdownComponent } from '~/components/aiAssistant/Markdown'
import { useOnConversationSubscription } from '~/generated/graphql'
import { useAIAssistantTool } from '~/hooks/useAIAssistantTool'

gql`
  subscription onConversation($conversationId: ID!) {
    aiConversationStreamed(conversationId: $conversationId) {
      chunk
      done
    }
  }
`

export const ChatConversation: FC = () => {
  const [output, setOutput] = useState('')
  const [isStreamFinished, setIsStreamFinished] = useState(false)
  const { conversationId, message } = useAIAssistantTool()

  const subscription = useOnConversationSubscription({
    skip: !conversationId,
    variables: { conversationId: conversationId ?? '' },
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

  const { blockMatches } = useLLMOutput({
    llmOutput: output,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished,
    throttle: throttleBasic({
      windowLookBackMs: 1000,
    }),
  })

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto">
      <ChatMessages.Sent>{message}</ChatMessages.Sent>

      {subscription.loading && <ChatMessages.Loading />}

      {subscription.error ? (
        <ChatMessages.Error>{`There was an error generating a response.`}</ChatMessages.Error>
      ) : (
        <ChatMessages.Received>
          {blockMatches.map((blockMatch, index) => {
            const Component = blockMatch.block.component

            return <Component key={index} blockMatch={blockMatch} />
          })}
        </ChatMessages.Received>
      )}
    </div>
  )
}
