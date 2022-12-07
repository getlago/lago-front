import { useMemo } from 'react'
import { gql, ApolloError } from '@apollo/client'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import _groupBy from 'lodash/groupBy'

import {
  useGetInvoiceCreateCreditNoteQuery,
  LagoApiError,
  InvoiceCreateCreditNoteFragment,
  FeeTypesEnum,
  useCreateCreditNoteMutation,
  InvoiceFeeFragment,
  CreateCreditNoteInvoiceFragmentDoc,
  InvoiceTypeEnum,
  CurrencyEnum,
} from '~/generated/graphql'
import { ERROR_404_ROUTE, CUSTOMER_INVOICE_OVERVIEW_ROUTE } from '~/core/router'
import { hasDefinedGQLError, addToast } from '~/core/apolloClient'
import { FeesPerInvoice, CreditNoteForm, FromFee } from '~/components/creditNote/types'
import { serializeCreditNoteInput } from '~/core/serializers'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

gql`
  fragment InvoiceFee on Fee {
    id
    amountCurrency
    feeType
    vatRate
    creditableAmountCents
    charge {
      id
      billableMetric {
        id
        name
      }
    }
    group {
      key
      value
    }
  }

  fragment InvoiceCreateCreditNote on Invoice {
    id
    refundableAmountCents
    creditableAmountCents
    invoiceType
    fees {
      id
      amountCurrency
      itemCode
      itemName
      creditableAmountCents
      vatRate
    }
    invoiceSubscriptions {
      subscription {
        id
        name
        plan {
          id
          name
        }
      }
      fees {
        ...InvoiceFee
      }
    }
    ...CreateCreditNoteInvoice
  }

  query getInvoiceCreateCreditNote($id: ID!) {
    invoice(id: $id) {
      ...InvoiceCreateCreditNote
    }
  }

  mutation createCreditNote($input: CreateCreditNoteInput!) {
    createCreditNote(input: $input) {
      id
    }
  }

  ${CreateCreditNoteInvoiceFragmentDoc}
`

type UseCreateCreditNoteReturn = {
  loading: boolean
  invoice?: InvoiceCreateCreditNoteFragment
  feesPerInvoice?: FeesPerInvoice
  feeForAddOn?: FromFee
  onCreate: (
    value: CreditNoteForm
  ) => Promise<{ data?: { createCreditNote?: { id?: string } }; errors?: ApolloError }>
}

export const useCreateCreditNote: () => UseCreateCreditNoteReturn = () => {
  const { invoiceId, id } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = useGetInvoiceCreateCreditNoteQuery({
    fetchPolicy: 'network-only',
    context: { silentError: LagoApiError.NotFound },
    variables: {
      id: invoiceId as string,
    },
    skip: !invoiceId,
  })
  const [create] = useCreateCreditNoteMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted({ createCreditNote }) {
      if (!!createCreditNote) {
        addToast({
          severity: 'success',
          translateKey: 'text_63763e61409e0d55b268a590',
        })

        navigate(generatePath(CUSTOMER_INVOICE_OVERVIEW_ROUTE, { invoiceId, id }))
      }
    },
  })

  if (
    !invoiceId ||
    hasDefinedGQLError('NotFound', error, 'invoice') ||
    (data?.invoice?.refundableAmountCents === 0 && data?.invoice?.creditableAmountCents === 0)
  ) {
    navigate(ERROR_404_ROUTE)
  }

  const feeForAddOn = useMemo(() => {
    if (data?.invoice?.invoiceType === InvoiceTypeEnum.AddOn) {
      const addOnFee = (data?.invoice?.fees || [])[0]

      return {
        id: addOnFee?.id,
        checked: true,
        value: deserializeAmount(addOnFee?.creditableAmountCents, addOnFee.amountCurrency),
        name: addOnFee?.itemName,
        maxAmount: addOnFee?.creditableAmountCents,
        vatRate: addOnFee?.vatRate || 0,
      }
    }

    return undefined
  }, [data?.invoice])

  const feesPerInvoice = useMemo(() => {
    return data?.invoice?.invoiceSubscriptions?.reduce<FeesPerInvoice>(
      (subAcc, invoiceSubscription) => {
        const groupedFees = _groupBy(invoiceSubscription?.fees, 'charge.id') as {
          [key: string]: InvoiceFeeFragment[]
        }
        const subscriptionName: string =
          invoiceSubscription?.subscription?.name || invoiceSubscription?.subscription?.plan?.name

        const subscriptionFees = Object.keys(groupedFees).reduce((groupApp, groupKey, index) => {
          if (groupKey === 'undefined') {
            const fee = groupedFees[groupKey][0]

            if (fee?.creditableAmountCents > 0) {
              return {
                [`0_${fee?.id}`]: {
                  id: fee?.id,
                  checked: true,
                  value: deserializeAmount(fee?.creditableAmountCents, fee.amountCurrency),
                  name: subscriptionName,
                  maxAmount: fee?.creditableAmountCents,
                  vatRate: fee?.vatRate,
                },
                ...groupApp,
              }
            }

            return groupApp
          }
          const feeGroup = groupedFees[groupKey] as InvoiceFeeFragment[]
          const firstFee = groupedFees[groupKey][0]

          if (
            feeGroup.length === 1 &&
            [FeeTypesEnum.Charge, FeeTypesEnum.Subscription].includes(feeGroup[0]?.feeType) &&
            firstFee?.creditableAmountCents > 0
          ) {
            return {
              ...groupApp,
              [`${index}_${firstFee?.id}`]: {
                id: firstFee?.id,
                checked: true,
                value: deserializeAmount(firstFee?.creditableAmountCents, firstFee.amountCurrency),
                name: firstFee?.charge?.billableMetric?.name,
                maxAmount: firstFee?.creditableAmountCents,
                vatRate: firstFee?.vatRate,
              },
            }
          }
          const grouped = feeGroup.reduce((accFee, feeGrouped) => {
            if (
              feeGrouped?.creditableAmountCents === 0 ||
              ![FeeTypesEnum.Charge, FeeTypesEnum.Subscription].includes(feeGrouped.feeType)
            ) {
              return accFee
            }

            return {
              ...accFee,
              [feeGrouped?.id]: {
                id: feeGrouped?.id,
                checked: true,
                value: deserializeAmount(
                  feeGrouped?.creditableAmountCents,
                  feeGrouped.amountCurrency
                ),
                name: feeGrouped?.group?.key
                  ? `${feeGrouped?.group?.key} • ${feeGrouped?.group?.value}`
                  : (feeGrouped?.group?.value as string),
                maxAmount: feeGrouped?.creditableAmountCents,
                vatRate: feeGrouped?.vatRate,
              },
            }
          }, {})

          return Object.keys(grouped).length > 0
            ? {
                ...groupApp,
                [groupKey]: {
                  name: firstFee?.charge?.billableMetric?.name as string,
                  grouped,
                },
              }
            : groupApp
        }, {})

        return Object.keys(subscriptionFees).length > 0
          ? {
              ...subAcc,
              [invoiceSubscription?.subscription?.id]: {
                subscriptionName,
                fees: subscriptionFees,
              },
            }
          : subAcc
      },
      {}
    )
  }, [data?.invoice])

  return {
    loading,
    invoice: data?.invoice || undefined,
    feesPerInvoice,
    feeForAddOn,
    onCreate: async (values) => {
      const answer = await create({
        variables: {
          input: serializeCreditNoteInput(
            invoiceId as string,
            values,
            data?.invoice?.amountCurrency || CurrencyEnum.Usd
          ),
        },
      })

      return answer as Promise<{
        data?: { createCreditNote?: { id?: string } }
        errors?: ApolloError
      }>
    },
  }
}
