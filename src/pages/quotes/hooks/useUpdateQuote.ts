import { gql } from '@apollo/client'

import { addToast } from '~/core/apolloClient'
import {
  LagoApiError,
  type UpdateQuoteInput,
  type UpdateQuoteVersionInput,
  useUpdateQuoteMutation,
  useUpdateQuoteVersionMutation,
} from '~/generated/graphql'

gql`
  mutation updateQuoteVersion($input: UpdateQuoteVersionInput!) {
    updateQuoteVersion(input: $input) {
      id
      currency
      billingEntityId
      # The document renders variable ids against this dict, and a draft recomputes it live from
      # the version's billing entity and currency. Selecting it lets the mutation refresh the
      # normalized QuoteVersion, so the preview stops showing the previous entity's values
      # without a second round trip (LAGO-1839).
      mentionVariables
    }
  }

  mutation updateQuote($input: UpdateQuoteInput!) {
    updateQuote(input: $input) {
      id
      currentVersion {
        id
        version
        status
      }
    }
  }
`

interface UseUpdateQuoteOptions {
  onUpdateFinished?: () => void
  onUpdateError?: () => void
}

export const useUpdateQuote = ({ onUpdateFinished, onUpdateError }: UseUpdateQuoteOptions = {}) => {
  const [updateQuoteVersionMutation, { loading: isUpdatingQuoteVersion }] =
    useUpdateQuoteVersionMutation()
  const [updateQuoteMutation, { loading: isUpdatingQuote }] = useUpdateQuoteMutation()

  const updateQuoteVersion = async (
    input: UpdateQuoteVersionInput,
    displayToast: boolean = true,
  ) => {
    const result = await updateQuoteVersionMutation({
      variables: { input },
      context: { silentError: LagoApiError.UnprocessableEntity },
    })

    const hasErrors = !!result.errors?.length || !result.data?.updateQuoteVersion

    if (!hasErrors) {
      if (displayToast) {
        addToast({
          severity: 'success',
          translateKey: 'text_17775394497682uzyy0lyyq7',
        })
      }
      onUpdateFinished?.()
    } else {
      onUpdateError?.()
    }

    return result
  }

  const updateQuote = (input: UpdateQuoteInput) =>
    updateQuoteMutation({
      variables: { input },
    })

  return {
    updateQuoteVersion,
    isUpdatingQuoteVersion,
    updateQuote,
    isUpdatingQuote,
  }
}
