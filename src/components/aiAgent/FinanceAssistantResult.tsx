import { ChatMessages } from '~/components/aiAgent/ChatMessages'
import { useExportFinanceAssistant } from '~/components/aiAgent/hooks/useExportFinanceAssistant'
import { MarkdownContent } from '~/components/aiAgent/llmOutputs/Markdown'
import { Button } from '~/components/designSystem/Button'
import { addToast } from '~/core/apolloClient'
import { ChatMessage } from '~/hooks/aiAgent/aiAgentReducer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

type FinanceAssistantResultProps = {
  message: ChatMessage
}

export const FinanceAssistantResult = ({ message }: FinanceAssistantResultProps) => {
  const { translate } = useInternationalization()
  const { exportResult, loading } = useExportFinanceAssistant()
  const result = message.financeAssistantResult

  if (!result) return null

  const messageId = result.messageId

  const handleExport = async () => {
    if (!messageId) return

    try {
      await exportResult(messageId)
    } catch {
      addToast({ severity: 'danger', translateKey: 'text_1782899568265bph7iv6nops' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!!result.sessionExpired && (
        <ChatMessages.Info>{translate('text_178108767575418a6s91vcje')}</ChatMessages.Info>
      )}

      <MarkdownContent>{message.message}</MarkdownContent>

      {!!result.results && (
        <div className="box-content overflow-hidden rounded-lg border border-grey-300 bg-grey-100">
          <div className="flex flex-col">
            {!!messageId && (
              <div className="mr-4 flex h-10 items-center justify-end">
                <Button
                  className="text-grey-600"
                  variant="quaternary"
                  size="small"
                  icon="download"
                  aria-label={translate('text_1782899568265kc2tovrmz2s')}
                  loading={loading}
                  onClick={handleExport}
                ></Button>
              </div>
            )}

            <div
              className={tw(
                'overflow-x-auto border border-grey-300 bg-white',
                !!messageId && '-mx-px -mb-px rounded-b-lg',
                !messageId && 'rounded-lg',
              )}
            >
              <div className="min-w-max p-3">
                <MarkdownContent>{result.results}</MarkdownContent>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
