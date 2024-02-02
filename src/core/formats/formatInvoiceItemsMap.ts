import { gql } from '@apollo/client'

import { Fee, FeeTypesEnum, InvoiceStatusTypeEnum, InvoiceSubscription } from '~/generated/graphql'

gql`
  fragment InvoiceSubscriptionFormating on InvoiceSubscription {
    fromDatetime
    toDatetime
    chargesFromDatetime
    chargesToDatetime
    inAdvanceChargesFromDatetime
    inAdvanceChargesToDatetime
    fees {
      id
      amountCents
      invoiceName
      invoiceDisplayName
      groupName
      units
      groupedBy
      charge {
        id
        payInAdvance
        minAmountCents
        billableMetric {
          id
          name
        }
      }
      subscription {
        id
        plan {
          id
          interval
        }
      }
    }
    subscription {
      id
      name
      plan {
        id
        name
        invoiceDisplayName
      }
    }
    invoice {
      id
      status
    }
  }
`
export type TExtendedRemainingFee = Fee & {
  metadata: {
    displayName: string
    isSubscriptionFee?: boolean
    isGroupChildFee?: boolean
    isTrueUpFee?: boolean
    isNormalFee?: boolean
  }
}
export type TSubscriptionDataForDisplay = {
  [invoiceSubscriptionId: string]: {
    feesInArrears: TExtendedRemainingFee[]
    feesInArrearsZero: TExtendedRemainingFee[]
    feesInAdvance: TExtendedRemainingFee[]
    feesInAdvanceZero: TExtendedRemainingFee[]
    metadata: {
      differentBoundariesForSubscriptionAndCharges: boolean
      subscriptionDisplayName: string
      fromDatetime: string
      toDatetime: string
      chargesFromDatetime: string
      chargesToDatetime: string
      inAdvanceChargesFromDatetime: string
      inAdvanceChargesToDatetime: string
    }
  }
}
type TFormatedInvoiceSubscriptionDataForDisplay = {
  subscriptions: TSubscriptionDataForDisplay
  metadata: {
    hasAnyFeeParsed: boolean
    hasAnyPositiveFeeParsed: boolean
  }
}

export const getSubscriptionFeeDisplayName = (fee: TExtendedRemainingFee) => {
  if (!!fee.invoiceDisplayName) {
    return fee.invoiceDisplayName
  }

  const plan = fee.subscription?.plan
  const capitalizedPlanInterval = `${plan?.interval
    ?.charAt(0)
    ?.toUpperCase()}${plan?.interval?.slice(1)}`

  return `${capitalizedPlanInterval} subscription fee - ${plan?.name}`
}

export const groupAndFormatFees = (
  invoiceSubscription: InvoiceSubscription[] | null | undefined,
): TFormatedInvoiceSubscriptionDataForDisplay => {
  let hasAnyFeeParsed = false
  let hasAnyPositiveFeeParsed = false

  if (!invoiceSubscription?.length)
    return { subscriptions: {}, metadata: { hasAnyFeeParsed, hasAnyPositiveFeeParsed } }

  const feesGroupedBySubscription = invoiceSubscription?.reduce<TSubscriptionDataForDisplay>(
    (acc, invoiceSub) => {
      const subscriptionId = invoiceSub?.subscription?.id

      if (!subscriptionId) return acc

      const differentBoundariesForSubscriptionAndCharges: boolean =
        invoiceSub.fromDatetime !== invoiceSub.chargesFromDatetime &&
        invoiceSub.toDatetime !== invoiceSub.chargesToDatetime

      if (!acc[subscriptionId]) {
        acc[subscriptionId] = {
          feesInArrears: [],
          feesInArrearsZero: [],
          feesInAdvance: [],
          feesInAdvanceZero: [],
          metadata: {
            differentBoundariesForSubscriptionAndCharges,
            subscriptionDisplayName:
              invoiceSub.subscription.name || invoiceSub.subscription.plan.name,
            fromDatetime: invoiceSub?.fromDatetime,
            toDatetime: invoiceSub?.toDatetime,
            chargesFromDatetime: invoiceSub?.chargesFromDatetime,
            chargesToDatetime: invoiceSub?.chargesToDatetime,
            inAdvanceChargesFromDatetime: invoiceSub?.inAdvanceChargesFromDatetime,
            inAdvanceChargesToDatetime: invoiceSub?.inAdvanceChargesToDatetime,
          },
        }
      }

      if (!invoiceSub?.fees?.length) return acc

      // Group fees advance / arrear
      for (let i = 0; i < invoiceSub?.fees?.length; i++) {
        const currentFee = invoiceSub?.fees[i] as TExtendedRemainingFee

        const isZeroFee = currentFee.units === 0

        const isFeeInAdvance =
          currentFee.charge?.payInAdvance ||
          (currentFee.feeType === FeeTypesEnum.Subscription &&
            differentBoundariesForSubscriptionAndCharges)

        // Populate zero fees array for draft invoice
        if (invoiceSub?.invoice?.status === InvoiceStatusTypeEnum.Draft && isZeroFee) {
          if (isFeeInAdvance) {
            acc[subscriptionId]?.feesInAdvanceZero?.push(currentFee)
          } else {
            acc[subscriptionId]?.feesInArrearsZero?.push(currentFee)
          }

          !hasAnyFeeParsed && (hasAnyFeeParsed = true)
        } else if (!isZeroFee) {
          if (isFeeInAdvance) {
            acc[subscriptionId]?.feesInAdvance?.push(currentFee)
          } else {
            acc[subscriptionId]?.feesInArrears?.push(currentFee)
          }

          !hasAnyFeeParsed && (hasAnyFeeParsed = true)
          !hasAnyPositiveFeeParsed && (hasAnyPositiveFeeParsed = true)
        }
      }

      return acc
    },
    {},
  )

  // Format fees
  Object.keys(feesGroupedBySubscription).forEach((subscriptionId) => {
    const subscription = feesGroupedBySubscription[subscriptionId]

    if (subscription?.feesInArrears?.length) {
      feesGroupedBySubscription[subscriptionId].feesInArrears = _newDeepFormatFees(
        subscription.feesInArrears,
      )
    }
    if (subscription?.feesInArrearsZero?.length) {
      feesGroupedBySubscription[subscriptionId].feesInArrearsZero = _newDeepFormatFees(
        subscription.feesInArrearsZero,
      )
    }
    if (subscription?.feesInAdvance?.length) {
      feesGroupedBySubscription[subscriptionId].feesInAdvance = _newDeepFormatFees(
        subscription.feesInAdvance,
      )
    }
    if (subscription?.feesInAdvanceZero?.length) {
      feesGroupedBySubscription[subscriptionId].feesInAdvanceZero = _newDeepFormatFees(
        subscription.feesInAdvanceZero,
      )
    }
  })

  return {
    subscriptions: feesGroupedBySubscription,
    metadata: {
      hasAnyFeeParsed,
      hasAnyPositiveFeeParsed,
    },
  }
}

const _newDeepFormatFees = (feesToFormat: TExtendedRemainingFee[]): TExtendedRemainingFee[] => {
  const feesData: TExtendedRemainingFee[] = []

  // Mark fees depending on their type and add a display name
  for (let i = 0; i < feesToFormat.length; i++) {
    const fee = feesToFormat[i]

    const groupingChain =
      Object.values(fee?.groupedBy || {}).length > 0
        ? Object.values(fee?.groupedBy)
            .map((group) => (!!group ? ` • ${group}` : ''))
            .join('')
        : ''

    if (fee.feeType === FeeTypesEnum.Subscription) {
      feesData.push({
        ...fee,
        metadata: {
          isSubscriptionFee: true,
          displayName: getSubscriptionFeeDisplayName(fee),
        },
      })
    } else if (!!fee.group?.id) {
      feesData.push({
        ...fee,
        metadata: {
          isGroupChildFee: true,
          displayName: `${fee.invoiceName || fee.charge?.billableMetric?.name}${groupingChain}${
            fee.groupName
              ? ` • ${fee.groupName}`
              : ` • ${!!fee.group?.key ? `${fee.group?.key} • ` : ''}${fee.group?.value}`
          }`,
        },
      })
    } else if (!!fee?.trueUpParentFee?.id) {
      feesData.push({
        ...fee,
        metadata: {
          isTrueUpFee: true,
          displayName: `${
            fee.groupName || fee.invoiceName || fee.charge?.billableMetric?.name || ''
          } - True-up`,
        },
      })
    } else {
      feesData.push({
        ...fee,
        metadata: {
          isNormalFee: true,
          displayName: `${
            fee.invoiceDisplayName || fee.invoiceName || fee.charge?.billableMetric?.name || ''
          }${groupingChain}`,
        },
      })
    }
  }

  return feesData.sort((a, b) => {
    const aDisplayName = a?.metadata?.displayName.toLowerCase().replace('•', '').replace('-', '')
    const bDisplayName = b?.metadata?.displayName.toLowerCase().replace('•', '').replace('-', '')

    if (!!a?.metadata?.isSubscriptionFee && !b?.metadata?.isSubscriptionFee) {
      return -1
    } else if (!a?.metadata?.isSubscriptionFee && !!b?.metadata?.isSubscriptionFee) {
      return 1
    } else if (aDisplayName < bDisplayName) {
      return -1
    } else if (aDisplayName > bDisplayName) {
      return 1
    }
    return 0
  })
}
