import { ApolloError, gql } from '@apollo/client'
import _groupBy from 'lodash/groupBy'
import { useMemo } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { CreditNoteForm, FeesPerInvoice, FromFee } from '~/components/creditNote/types'
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
  InvoiceFeeFragment,
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
      if (!!createCreditNote) {
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
  })

  if (
    !invoiceId ||
    hasDefinedGQLError('NotFound', error, 'invoice') ||
    (data?.invoice?.refundableAmountCents === '0' && data?.invoice?.creditableAmountCents === '0')
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

          for (let i = 0; i < (feesWithoutTrueUpOnes || []).length; i++) {
            const currentFee = (feesWithoutTrueUpOnes || [])[i]

            if (!currentFee?.trueUpFee?.id) {
              newFees.push(currentFee)
            } else {
              const relatedTrueUpFee = unorderedData.find(
                (fee) => fee.id === currentFee.trueUpFee?.id,
              )

              newFees.push(currentFee)
              newFees.push(relatedTrueUpFee)
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

        const groupedFees = _groupBy(orderedData, (fee) => {
          // Custom group_by
          // either charge alone, group charge or true up fee
          if (fee?.feeType === FeeTypesEnum.Subscription) {
            return undefined
          } else if (!!fee?.chargeFilter?.id) {
            return fee?.charge?.id
          }

          return fee?.id
        }) as {
          [key: string]: InvoiceFeeFragment[]
        }

        const subscriptionName: string =
          invoiceSubscription?.subscription?.name ||
          invoiceSubscription.subscription.plan.invoiceDisplayName ||
          invoiceSubscription?.subscription?.plan?.name

        const subscriptionFees = Object.keys(groupedFees).reduce((groupApp, groupKey, index) => {
          if (groupKey === 'undefined') {
            const fee = groupedFees[groupKey][0]

            if (fee?.creditableAmountCents > 0) {
              const composableName = composeMultipleValuesWithSepator([
                fee?.invoiceName || subscriptionName,
                composeChargeFilterDisplayName(fee?.chargeFilter),
                composeGroupedByDisplayName(fee.groupedBy),
              ])

              return {
                [`0_${fee?.id}`]: {
                  id: fee?.id,
                  checked: true,
                  value: deserializeAmount(fee?.creditableAmountCents, fee.amountCurrency),
                  name: composableName,
                  isTrueUpFee: trueUpFeeIds?.includes(fee?.id),
                  trueUpFee: fee?.trueUpFee,
                  maxAmount: fee?.creditableAmountCents,
                  appliedTaxes: fee?.appliedTaxes || [],
                  succeededAt: fee?.succeededAt,
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
            [FeeTypesEnum.Charge, FeeTypesEnum.Subscription, FeeTypesEnum.Commitment].includes(
              feeGroup[0]?.feeType,
            ) &&
            firstFee?.creditableAmountCents > 0
          ) {
            const composableName =
              firstFee.invoiceDisplayName ||
              (firstFee.feeType === FeeTypesEnum.Commitment
                ? 'Minimum commitment - True up'
                : composeMultipleValuesWithSepator([
                    firstFee?.invoiceName || subscriptionName,
                    composeChargeFilterDisplayName(firstFee?.chargeFilter),
                    composeGroupedByDisplayName(firstFee.groupedBy),
                  ]))

            return {
              ...groupApp,
              [`${index}_${firstFee?.id}`]: {
                id: firstFee?.id,
                checked: true,
                value: deserializeAmount(firstFee?.creditableAmountCents, firstFee.amountCurrency),
                name: composableName,
                isTrueUpFee: trueUpFeeIds?.includes(firstFee?.id),
                trueUpFee: firstFee?.trueUpFee,
                maxAmount: firstFee?.creditableAmountCents,
                appliedTaxes: firstFee?.appliedTaxes || [],
                succeededAt: firstFee?.succeededAt,
              },
            }
          }

          const grouped = feeGroup.reduce((accFee, feeGrouped) => {
            if (
              feeGrouped?.creditableAmountCents === '0' ||
              ![FeeTypesEnum.Charge, FeeTypesEnum.Subscription].includes(feeGrouped.feeType)
            ) {
              return accFee
            }

            const composableName =
              feeGrouped.invoiceDisplayName ||
              composeMultipleValuesWithSepator([
                composeChargeFilterDisplayName(feeGrouped?.chargeFilter),
                composeGroupedByDisplayName(feeGrouped.groupedBy),
              ])

            return {
              ...accFee,
              [feeGrouped?.id]: {
                id: feeGrouped?.id,
                checked: true,
                isTrueUpFee: trueUpFeeIds?.includes(feeGrouped?.id),
                value: deserializeAmount(
                  feeGrouped?.creditableAmountCents,
                  feeGrouped.amountCurrency,
                ),
                name: composableName,
                maxAmount: feeGrouped?.creditableAmountCents,
                appliedTaxes: feeGrouped?.appliedTaxes || [],
              },
            }
          }, {})

          return Object.keys(grouped).length > 0
            ? {
                ...groupApp,
                [groupKey]: {
                  name: firstFee.invoiceName || (firstFee?.charge?.billableMetric?.name as string),
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
