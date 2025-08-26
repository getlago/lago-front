import { markdownLookBack } from '@llm-ui/markdown'
import { throttleBasic, useLLMOutput } from '@llm-ui/react'
import { Icon, Typography } from 'lago-design-system'
import { FC, ReactNode, useEffect, useState } from 'react'

import { MarkdownComponent } from '~/components/aiAssistant/Markdown'
import { useOnConversationSubscription } from '~/generated/graphql'
import { useAIAssistantTool } from '~/hooks/useAIAssistantTool'

const SentMessage = ({ children }: { children: ReactNode }) => {
  return (
    <Typography
      className="ml-7 rounded-md border border-grey-300 bg-grey-100 px-3 py-2"
      color="grey700"
    >
      {children}
    </Typography>
  )
}

const ReceivedMessage = ({ children }: { children: ReactNode }) => {
  return <Typography color="grey700">{children}</Typography>
}

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
    isStreamFinished,
    throttle: throttleBasic({
      windowLookBackMs: 1000,
    }),
  })

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto">
      <SentMessage>{message}</SentMessage>
      {subscription.loading ? (
        <Icon size="large" name="sparkles-union" animation="spin" />
      ) : (
        <ReceivedMessage>
          {blockMatches.map((blockMatch, index) => {
            const Component = blockMatch.block.component

            return <Component key={index} blockMatch={blockMatch} />
          })}
        </ReceivedMessage>
      )}
    </div>
  )
}
