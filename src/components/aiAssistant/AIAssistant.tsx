import { gql } from '@apollo/client'
import { Panel } from 'react-resizable-panels'

import { NavSection } from '~/components/aiAssistant/NavSection'
import { PANEL_CLOSED, PANEL_OPEN, useAIAssistantTool } from '~/hooks/useAIAssistantTool'

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
  const { panelRef } = useAIAssistantTool()
  // const [conversationId, setConversationId] = useState<string | null>(null)

  // const [createAiConversation, { loading: mutationLoading, error: mutationError }] =
  //   useCreateAiConversationMutation()

  // const handleCreateAiConversation = async () => {
  //   try {
  //     await createAiConversation({
  //       variables: { input: { inputData: 'Hello, how are you?' } },

  //       onCompleted: (data) => {
  //         if (data.createAiConversation) {
  //           setConversationId(data.createAiConversation.conversationId)
  //         }
  //       },
  //     })
  //   } catch {
  //     // Handle error silently or log to monitoring service
  //   }
  // }

  // const { data: subscriptionData, error: subscriptionError } = useOnConversationSubscription({
  //   variables: { conversationId: conversationId ?? '' },
  //   skip: !conversationId,
  // })

  // const { blockMatches } = useLLMOutput({
  //   llmOutput: subscriptionData?.aiConversationStreamed.inputData ?? '',
  //   fallbackBlock: {
  //     component: MarkdownComponent,
  //     lookBack: markdownLookBack(),
  //   },
  //   blocks: [
  //     {
  //       component: CodeBlock,
  //       findCompleteMatch: findCompleteCodeBlock(),
  //       findPartialMatch: findPartialCodeBlock(),
  //       lookBack: codeBlockLookBack(),
  //     },
  //   ],
  //   isStreamFinished: false,
  // })

  return (
    <>
      <div className="relative">
        <div className="h-screen w-12 bg-white shadow-l">
          <div className="absolute rotate-90-tl">
            <NavSection />
          </div>
        </div>
      </div>

      <Panel
        ref={panelRef}
        defaultSize={PANEL_CLOSED}
        minSize={PANEL_CLOSED}
        maxSize={PANEL_OPEN}
        className="shadow-l"
      >
        <div>Hello</div>
      </Panel>
    </>
  )
}
