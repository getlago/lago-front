import { gql } from '@apollo/client'

import { useAskFinanceAssistantMutation } from '~/generated/graphql'

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
  const [askFinanceAssistant] = useAskFinanceAssistantMutation()

  return { askFinanceAssistant }
}
