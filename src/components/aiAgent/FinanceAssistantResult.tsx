import { ChatMessages } from '~/components/aiAgent/ChatMessages'
import { MarkdownContent } from '~/components/aiAgent/llmOutputs/Markdown'
import { ChatMessage } from '~/hooks/aiAgent/aiAgentReducer'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FinanceAssistantResultProps = {
  message: ChatMessage
}

export const FinanceAssistantResult = ({ message }: FinanceAssistantResultProps) => {
  const { translate } = useInternationalization()
  const result = message.financeAssistantResult

  if (!result) return null

  return (
    <div className="flex flex-col gap-4">
      {!!result.sessionExpired && (
        <ChatMessages.Info>{translate('text_178108767575418a6s91vcje')}</ChatMessages.Info>
      )}

      <MarkdownContent>{message.message}</MarkdownContent>

      {!!result.results && (
        <div className="overflow-x-auto rounded-lg border border-grey-300 bg-white">
          <div className="min-w-max p-3">
            <MarkdownContent>{result.results}</MarkdownContent>
          </div>
        </div>
      )}
    </div>
  )
}
