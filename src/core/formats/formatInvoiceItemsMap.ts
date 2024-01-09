import { gql } from '@apollo/client'

import { Fee, FeeTypesEnum, InvoiceSubscription } from '~/generated/graphql'

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
type TSubscriptionDataForDisplay = {
  [invoiceSubscriptionId: string]: {
    feesInArrears: TExtendedRemainingFee[]
    feesInAdvance: TExtendedRemainingFee[]
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

  if (!invoiceSubscription?.length) return { subscriptions: {}, metadata: { hasAnyFeeParsed } }

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
          feesInAdvance: [],
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

        // Prevent zero amount fees from being displayed
        if (
          (currentFee.feeType === FeeTypesEnum.Subscription &&
            Number(currentFee.amountCents) === 0) ||
          (currentFee.units === 0 && Number(currentFee.amountCents) === 0)
        )
          continue

        // Flag that at least one fee has been parsed
        !hasAnyFeeParsed && (hasAnyFeeParsed = true)
        const isSubscriptionFeeInAdvance =
          currentFee.feeType === FeeTypesEnum.Subscription &&
          differentBoundariesForSubscriptionAndCharges

        if (currentFee?.charge?.payInAdvance || isSubscriptionFeeInAdvance) {
          acc[subscriptionId]?.feesInAdvance?.push(currentFee)
        } else {
          acc[subscriptionId]?.feesInArrears?.push(currentFee)
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
    if (subscription?.feesInAdvance?.length) {
      feesGroupedBySubscription[subscriptionId].feesInAdvance = _newDeepFormatFees(
        subscription.feesInAdvance,
      )
    }
  })

  return {
    subscriptions: feesGroupedBySubscription,
    metadata: {
      hasAnyFeeParsed,
    },
  }
}

const _newDeepFormatFees = (feesToFormat: TExtendedRemainingFee[]): TExtendedRemainingFee[] => {
  const feesData: TExtendedRemainingFee[] = []

  // Mark fees depending on their type and add a display name
  for (let i = 0; i < feesToFormat.length; i++) {
    const fee = feesToFormat[i]

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
          displayName: `${`${fee.invoiceName || fee.charge?.billableMetric?.name} • `}${
            fee.groupName
              ? fee.groupName
              : `${!!fee.group?.key ? `${fee.group?.key} • ` : ''}${fee.group.value}`
          }`,
        },
      })
    } else if (!!fee?.trueUpParentFee?.id) {
      feesData.push({
        ...fee,
        metadata: {
          isTrueUpFee: true,
          displayName: fee.groupName || fee.invoiceName || fee.charge?.billableMetric?.name || '',
        },
      })
    } else {
      feesData.push({
        ...fee,
        metadata: {
          isNormalFee: true,
          displayName:
            fee.invoiceDisplayName || fee.invoiceName || fee.charge?.billableMetric?.name || '',
        },
      })
    }
  }

  return feesData.sort((a, b) => {
    if (!!a?.metadata?.isSubscriptionFee && !b?.metadata?.isSubscriptionFee) {
      return -1
    } else if (!a?.metadata?.isSubscriptionFee && !!b?.metadata?.isSubscriptionFee) {
      return 1
    } else if (a?.metadata?.displayName.toLowerCase() < b?.metadata?.displayName.toLowerCase()) {
      return -1
    } else if (a?.metadata?.displayName.toLowerCase() > b?.metadata?.displayName.toLowerCase()) {
      return 1
    }
    return 0
  })
}
