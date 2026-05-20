import { gql } from '@apollo/client'

import { addToast } from '~/core/apolloClient'
import {
  type UpdateQuoteInput,
  type UpdateQuoteVersionInput,
  useUpdateQuoteMutation,
  useUpdateQuoteVersionMutation,
} from '~/generated/graphql'

gql`
  mutation updateQuoteVersion($input: UpdateQuoteVersionInput!) {
    updateQuoteVersion(input: $input) {
      id
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
}

export const useUpdateQuote = ({ onUpdateFinished }: UseUpdateQuoteOptions = {}) => {
  const [updateQuoteVersionMutation, { loading: isUpdatingQuoteVersion }] =
    useUpdateQuoteVersionMutation()
  const [updateQuoteMutation, { loading: isUpdatingQuote }] = useUpdateQuoteMutation()

  const updateQuoteVersion = async (
    input: UpdateQuoteVersionInput,
    displayToast: boolean = true,
  ) => {
    const result = await updateQuoteVersionMutation({
      variables: { input },
    })

    if (result.data?.updateQuoteVersion && displayToast) {
      addToast({
        severity: 'success',
        translateKey: 'text_17775394497682uzyy0lyyq7',
      })
    }

    if (result.data?.updateQuoteVersion) {
      onUpdateFinished?.()
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
