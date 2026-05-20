import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { addToast } from '~/core/apolloClient'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  CreateQuoteInput,
  CurrencyEnum,
  useCreateQuoteMutation,
  useUpdateCustomerCurrencyForQuoteMutation,
} from '~/generated/graphql'

gql`
  mutation createQuote($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
    }
  }

  mutation updateCustomerCurrencyForQuote($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      currency
    }
  }
`

interface CreateQuoteValues {
  customerId: string
  orderType: CreateQuoteInput['orderType']
  subscriptionId?: string
  owners?: string[]
  currency?: CurrencyEnum
  customerExternalId?: string
  hasCustomerCurrency?: boolean
}

interface UseCreateQuoteReturn {
  loading: boolean
  onSave: (values: CreateQuoteValues) => Promise<void>
}

export const useCreateQuote = (): UseCreateQuoteReturn => {
  const navigate = useNavigate()

  const [updateCustomerCurrency] = useUpdateCustomerCurrencyForQuoteMutation()

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

  const onSave = async (values: CreateQuoteValues): Promise<void> => {
    if (!values.hasCustomerCurrency && values.currency && values.customerExternalId) {
      await updateCustomerCurrency({
        variables: {
          input: {
            id: values.customerId,
            externalId: values.customerExternalId,
            currency: values.currency,
          },
        },
      })
    }

    await createQuote({
      variables: {
        input: {
          customerId: values.customerId,
          orderType: values.orderType,
          subscriptionId: values.subscriptionId || undefined,
          owners: values.owners,
          billingItems: values.currency ? { currency: values.currency } : undefined,
        },
      },
    })
  }

  return {
    loading,
    onSave,
  }
}
