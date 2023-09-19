import { ApolloError, gql } from '@apollo/client'
import _groupBy from 'lodash/groupBy'
import { useMemo } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { CreditNoteForm, FeesPerInvoice, FromFee } from '~/components/creditNote/types'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CUSTOMER_INVOICE_DETAILS_ROUTE, ERROR_404_ROUTE } from '~/core/router'
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
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'

gql`
  fragment InvoiceFee on Fee {
    id
    amountCurrency
    feeType
    appliedTaxes {
      id
      tax {
        id
        name
        rate
      }
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
      appliedTaxes {
        id
        tax {
          id
          name
          rate
        }
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

        navigate(
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            id,
            invoiceId,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
          })
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
            name: fee?.itemName,
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
            (fee) => !trueUpFeeIds?.includes(fee?.id)
          )
          const newFees = []

          for (let i = 0; i < (feesWithoutTrueUpOnes || []).length; i++) {
            const currentFee = (feesWithoutTrueUpOnes || [])[i]

            if (!currentFee?.trueUpFee?.id) {
              newFees.push(currentFee)
            } else {
              const relatedTrueUpFee = unorderedData.find(
                (fee) => fee.id === currentFee.trueUpFee?.id
              )

              newFees.push(currentFee)
              newFees.push(relatedTrueUpFee)
            }
          }

          return newFees
        }

        const orderedData = reorderFees(invoiceSubscription?.fees as Fee[])

        const groupedFees = _groupBy(orderedData, (fee) => {
          // Custom group_by
          // either charge alone, group charge or true up fee
          if (!fee?.charge && !fee?.group && !fee?.trueUpFee) {
            return undefined
          } else if (!!fee?.charge?.id && fee?.group?.value) {
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
              return {
                [`0_${fee?.id}`]: {
                  id: fee?.id,
                  checked: true,
                  value: deserializeAmount(fee?.creditableAmountCents, fee.amountCurrency),
                  name: subscriptionName,
                  isTrueUpFee: trueUpFeeIds?.includes(fee?.id),
                  trueUpFee: fee?.trueUpFee,
                  maxAmount: fee?.creditableAmountCents,
                  appliedTaxes: fee?.appliedTaxes || [],
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
                isTrueUpFee: trueUpFeeIds?.includes(firstFee?.id),
                trueUpFee: firstFee?.trueUpFee,
                maxAmount: firstFee?.creditableAmountCents,
                appliedTaxes: firstFee?.appliedTaxes || [],
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
                appliedTaxes: feeGrouped?.appliedTaxes || [],
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
            data?.invoice?.currency || CurrencyEnum.Usd
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
