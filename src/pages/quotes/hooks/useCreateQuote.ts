import { gql } from '@apollo/client'
import { generatePath, useNavigate } from 'react-router-dom'

import { addToast } from '~/core/apolloClient'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE } from '~/core/router'
import { CreateQuoteInput, useCreateQuoteMutation } from '~/generated/graphql'

gql`
  mutation createQuote($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
    }
  }
`

interface UseCreateQuoteReturn {
  loading: boolean
  onSave: (values: Pick<CreateQuoteInput, 'customerId' | 'orderType'>) => Promise<void>
}

export const useCreateQuote = (): UseCreateQuoteReturn => {
  const navigate = useNavigate()

  const [createQuote, { loading }] = useCreateQuoteMutation({
    onCompleted({ createQuote: createdQuote }) {
      if (createdQuote) {
        addToast({
          severity: 'success',
          translateKey: 'text_1776238919927v1w2x3y4z5a',
        })

        navigate(
          generatePath(QUOTE_DETAILS_ROUTE, {
            quoteId: createdQuote.id,
            tab: QuoteDetailsTabsOptionsEnum.overview,
          }),
        )
      }
    },
  })

  const onSave = async (
    values: Pick<CreateQuoteInput, 'customerId' | 'orderType'>,
  ): Promise<void> => {
    await createQuote({
      variables: {
        input: {
          customerId: values.customerId,
          orderType: values.orderType,
        },
      },
    })
  }

  return {
    loading,
    onSave,
  }
}
