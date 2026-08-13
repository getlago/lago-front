import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { APPROVE_QUOTE_ROUTE, useNavigate } from '~/core/router'
import { useApproveQuoteVersionMutation } from '~/generated/graphql'

import { QUOTE_MUTATION_SILENT_ERROR_CODES } from '../utils/quoteMutationErrors'

gql`
  mutation approveQuoteVersion($input: ApproveQuoteVersionInput!) {
    approveQuoteVersion(input: $input) {
      id
      status
    }
  }
`

export const useApproveQuote = () => {
  const navigate = useNavigate()

  const goToApproveQuote = (quoteId: string, versionId: string) => {
    navigate(generatePath(APPROVE_QUOTE_ROUTE, { quoteId, versionId }))
  }

  const [approveQuote] = useApproveQuoteVersionMutation({
    refetchQueries: ['getQuotes'],
    // Handled locally by `getQuoteMutationErrors`, so the global error link must not
    // also fire its generic toast (nor report these expected failures to Sentry).
    // Copied: the link pushes its own force-silenced codes onto the array it receives.
    context: { silentErrorCodes: [...QUOTE_MUTATION_SILENT_ERROR_CODES] },
  })

  return { goToApproveQuote, approveQuote }
}
