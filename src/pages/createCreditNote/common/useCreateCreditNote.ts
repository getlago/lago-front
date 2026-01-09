import { ApolloError, gql } from '@apollo/client'
import { useMemo } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { CreditNoteForm, FeesPerInvoice, FromFee } from '~/components/creditNote/types'
import { isCreditNoteCreationDisabled } from '~/components/creditNote/utils'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, ERROR_404_ROUTE } from '~/core/router'
import { serializeCreditNoteInput } from '~/core/serializers'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreateCreditNoteInvoiceFragmentDoc,
  CurrencyEnum,
  Fee,
  FeeTypesEnum,
  InvoiceCreateCreditNoteFragment,
  InvoiceTypeEnum,
  LagoApiError,
  useCreateCreditNoteMutation,
  useGetInvoiceCreateCreditNoteQuery,
} from '~/generated/graphql'

gql`
  fragment InvoiceFee on Fee {
    id
    amountCurrency
    feeType
    invoiceName
    invoiceDisplayName
    groupedBy
    succeededAt
    appliedTaxes {
      id
      taxName
      taxRate
    }
    creditableAmountCents
    trueUpFee {
      id
    }
    charge {
      id
      billableMetric {
        id
        name
      }
    }
    chargeFilter {
      id
      invoiceDisplayName
      values
    }
  }

  fragment CreateCreditNoteInvoice on Invoice {
    id
    currency
    number
    status
    paymentStatus
    creditableAmountCents
    refundableAmountCents
    subTotalIncludingTaxesAmountCents
    availableToCreditAmountCents
    totalPaidAmountCents
    totalAmountCents
    paymentDisputeLostAt
    invoiceType
    ...InvoiceForCreditNoteFormCalculation
    ...InvoiceForCreditNoteFormCalculation
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
      invoiceName
      invoiceDisplayName
      creditableAmountCents
      succeededAt
      appliedTaxes {
        id
        taxName
        taxRate
      }
      trueUpFee {
        id
      }
    }
    invoiceSubscriptions {
      subscription {
        id
        name
        plan {
          id
          name
          invoiceDisplayName
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
  feeForAddOn?: FromFee[]
  feeForCredit?: FromFee[]
  onCreate: (
    value: CreditNoteForm,
  ) => Promise<{ data?: { createCreditNote?: { id?: string } }; errors?: ApolloError }>
}

export const useCreateCreditNote: () => UseCreateCreditNoteReturn = () => {
  const { invoiceId, customerId } = useParams()
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
      if (createCreditNote) {
        addToast({
          severity: 'success',
          translateKey: 'text_63763e61409e0d55b268a590',
        })

        navigate(
          generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
            customerId: customerId as string,
            invoiceId: invoiceId as string,
            creditNoteId: createCreditNote.id,
          }),
        )
      }
    },
    onError() {
      addToast({
        severity: 'danger',
        translateKey: 'text_622f7a3dc32ce100c46a5154',
      })
    },
  })

  if (
    !invoiceId ||
    hasDefinedGQLError('NotFound', error, 'invoice') ||
    isCreditNoteCreationDisabled(data?.invoice)
  ) {
    navigate(ERROR_404_ROUTE)
  }

  const feeForCredit = useMemo(() => {
    if (data?.invoice?.invoiceType === InvoiceTypeEnum.Credit) {
      return data?.invoice?.fees?.reduce<FromFee[]>((acc, fee) => {
        if (Number(fee?.creditableAmountCents) > 0) {
          acc.push({
            id: fee?.id,
            checked: true,
            value: deserializeAmount(fee?.creditableAmountCents, fee.amountCurrency),
            name: fee?.invoiceName || fee.itemName,
            maxAmount: fee?.creditableAmountCents,
            appliedTaxes: fee?.appliedTaxes || [],
          })
        }

        return acc
      }, [])
    }

    return undefined
  }, [data?.invoice])

  const feeForAddOn = useMemo(() => {
    if (
      data?.invoice?.invoiceType === InvoiceTypeEnum.AddOn ||
      data?.invoice?.invoiceType === InvoiceTypeEnum.OneOff
    ) {
      return data?.invoice?.fees?.reduce<FromFee[]>((acc, fee) => {
        if (Number(fee?.creditableAmountCents) > 0) {
          acc.push({
            id: fee?.id,
            checked: true,
            value: deserializeAmount(fee?.creditableAmountCents, fee.amountCurrency),
            name: fee?.invoiceName || fee.itemName,
            maxAmount: fee?.creditableAmountCents,
            appliedTaxes: fee?.appliedTaxes || [],
          })
        }

        return acc
      }, [])
    }

    return undefined
  }, [data?.invoice])

  const feesPerInvoice = useMemo(() => {
    return data?.invoice?.invoiceSubscriptions?.reduce<FeesPerInvoice>(
      (subAcc, invoiceSubscription) => {
        const subscriptionName: string =
          invoiceSubscription?.subscription?.name ||
          invoiceSubscription?.subscription?.plan?.invoiceDisplayName ||
          invoiceSubscription?.subscription?.plan?.name

        const trueUpFeeIds = invoiceSubscription?.fees?.reduce<string[]>((acc, fee) => {
          if (fee?.trueUpFee?.id) {
            acc.push(fee?.trueUpFee?.id)
          }
          return acc
        }, [])

        // We need to reorder fees to have true up fees after their "parent" related charge
        const reorderFees = (unorderedData: Fee[]) => {
          if (!unorderedData.length || trueUpFeeIds?.length === 0) return unorderedData

          const feesWithoutTrueUpOnes = invoiceSubscription?.fees?.filter(
            (fee) => !trueUpFeeIds?.includes(fee?.id),
          )
          const newFees = []

          for (const currentFee of feesWithoutTrueUpOnes || []) {
            if (currentFee?.trueUpFee?.id) {
              const relatedTrueUpFee = unorderedData.find(
                (fee) => fee.id === currentFee.trueUpFee?.id,
              )

              newFees.push(currentFee, relatedTrueUpFee)
            } else {
              newFees.push(currentFee)
            }
          }

          return newFees
        }

        const orderedData = [...reorderFees(invoiceSubscription?.fees as Fee[])].sort((a, b) => {
          if (a?.feeType === FeeTypesEnum.Commitment && b?.feeType !== FeeTypesEnum.Commitment) {
            return 1
          } else if (
            a?.feeType !== FeeTypesEnum.Commitment &&
            b?.feeType === FeeTypesEnum.Commitment
          ) {
            return -1
          }
          return 0
        })

        const subscriptionFees = orderedData.reduce<FromFee[]>((acc, fee) => {
          if (!fee || Number(fee.creditableAmountCents) <= 0) {
            return acc
          }

          const composableName =
            fee.invoiceDisplayName ||
            (fee.feeType === FeeTypesEnum.Commitment
              ? 'Minimum commitment - True up'
              : composeMultipleValuesWithSepator([
                  fee.invoiceName || subscriptionName,
                  composeChargeFilterDisplayName(fee.chargeFilter),
                  composeGroupedByDisplayName(fee.groupedBy),
                ]))

          acc.push({
            id: fee.id,
            checked: true,
            value: deserializeAmount(fee.creditableAmountCents, fee.amountCurrency),
            name: composableName,
            isTrueUpFee: trueUpFeeIds?.includes(fee.id),
            maxAmount: fee.creditableAmountCents,
            appliedTaxes: fee.appliedTaxes || [],
            succeededAt: fee.succeededAt,
          })

          return acc
        }, [])

        return subscriptionFees.length > 0
          ? {
              ...subAcc,
              [invoiceSubscription?.subscription?.id]: {
                subscriptionName,
                fees: subscriptionFees,
              },
            }
          : subAcc
      },
      {},
    )
  }, [data?.invoice])

  return {
    loading,
    invoice: data?.invoice || undefined,
    feesPerInvoice,
    feeForAddOn,
    feeForCredit,
    onCreate: async (values) => {
      const answer = await create({
        variables: {
          input: serializeCreditNoteInput(
            invoiceId as string,
            values,
            data?.invoice?.currency || CurrencyEnum.Usd,
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
