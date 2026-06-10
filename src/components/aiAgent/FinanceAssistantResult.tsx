import { useState } from 'react'

import { ChatMessages } from '~/components/aiAgent/ChatMessages'
import { MarkdownContent } from '~/components/aiAgent/llmOutputs/Markdown'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { ChatMessage } from '~/hooks/aiAgent/aiAgentReducer'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FinanceAssistantResultProps = {
  message: ChatMessage
}

export const FinanceAssistantResult = ({ message }: FinanceAssistantResultProps) => {
  const { translate } = useInternationalization()
  const [showSql, setShowSql] = useState(false)
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

      {!!result.sqlQuery && (
        <div className="flex flex-col gap-2">
          <Button
            className="self-start"
            size="small"
            variant="inline"
            onClick={() => setShowSql((value) => !value)}
          >
            {showSql
              ? translate('text_1780562979520mxbgpqksusb')
              : translate('text_17805629795206sa8qhvz16j')}
          </Button>

          {showSql && (
            <pre className="overflow-x-auto rounded-lg bg-grey-100 p-3">
              <Typography component="code" variant="caption" color="grey700">
                {result.sqlQuery}
              </Typography>
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
