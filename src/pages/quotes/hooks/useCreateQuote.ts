import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { addToast } from '~/core/apolloClient'
import { EDIT_QUOTE_ROUTE, useNavigate } from '~/core/router'
import { CreateQuoteInput, useCreateQuoteMutation } from '~/generated/graphql'

gql`
  mutation createQuote($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
      currentVersion {
        id
      }
    }
  }
`

interface CreateQuoteValues {
  customerId: string
  orderType: CreateQuoteInput['orderType']
  subscriptionId?: string
  owners?: string[]
}

interface UseCreateQuoteReturn {
  loading: boolean
  onSave: (values: CreateQuoteValues) => Promise<void>
}

export const useCreateQuote = (): UseCreateQuoteReturn => {
  const navigate = useNavigate()

  const [createQuote, { loading }] = useCreateQuoteMutation({
    onCompleted({ createQuote: createdQuote }) {
      if (createdQuote?.currentVersion?.id && createdQuote.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1776238919927v1w2x3y4z5a',
        })

        navigate(
          generatePath(EDIT_QUOTE_ROUTE, {
            quoteId: createdQuote.id,
            versionId: createdQuote.currentVersion.id,
          }),
        )
      }
    },
  })

  const onSave = async (values: CreateQuoteValues): Promise<void> => {
    try {
      await createQuote({
        variables: {
          input: {
            customerId: values.customerId,
            orderType: values.orderType,
            subscriptionId: values.subscriptionId || undefined,
            owners: values.owners,
          },
        },
      })
    } catch {
      addToast({
        severity: 'danger',
        translateKey: 'text_1779972384579cgilv8fpjw6',
      })
    }
  }

  return {
    loading,
    onSave,
  }
}
