import { gql } from '@apollo/client'

import { useAskFinanceAssistantMutation } from '~/generated/graphql'
import { useAiAgent } from '~/hooks/aiAgent/useAiAgent'

gql`
  mutation askFinanceAssistant($input: AskFinanceAssistantInput!) {
    askFinanceAssistant(input: $input) {
      explanation
      results
      sessionExpired
      sessionId
      sqlQuery
    }
  }
`

export const useAskFinanceAssistant = () => {
  const { addNewMessage, completeExchange, failExchange, state } = useAiAgent()
  const [askFinanceAssistant] = useAskFinanceAssistantMutation()

  const submitFinanceQuestion = async (question: string) => {
    const exchangeId = crypto.randomUUID()

    addNewMessage(question, exchangeId)

    try {
      const { data } = await askFinanceAssistant({
        variables: {
          input: {
            question,
            sessionId: state.financeSessionId,
          },
        },
      })

      const answer = data?.askFinanceAssistant

      if (!answer) {
        return failExchange(exchangeId)
      }

      return completeExchange({
        exchangeId,
        response: answer.explanation,
        sessionId: answer.sessionId,
        financeAssistantResult: {
          results: answer.results,
          sessionExpired: answer.sessionExpired,
          sqlQuery: answer.sqlQuery || undefined,
        },
      })
    } catch {
      return failExchange(exchangeId)
    }
  }

  return { submitFinanceQuestion }
}
