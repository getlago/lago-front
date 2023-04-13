import _groupBy from 'lodash/groupBy'

import { Fee, FeeTypesEnum, InvoiceSubscription } from '~/generated/graphql'

type ExtendedRemainingFee = Fee & {
  displayName: string
  isGroupParentFee?: boolean
  isGroupChildFee?: boolean
  isTrueUpFee?: boolean
  isNormalFee?: boolean
}

interface BaseFormattedInvoiceSubscription {
  currentSubscription: InvoiceSubscription['subscription']
  invoiceDisplayName: string
  subscriptionFees: InvoiceSubscription['subscription']['fees']
  remainingFees: InvoiceSubscription['subscription']['fees']
}

interface FormattedInvoiceSubscription
  extends Omit<BaseFormattedInvoiceSubscription, 'remainingFees'> {
  remainingFees: ExtendedRemainingFee[]
}

const formatInvoiceItemsMap = (data: InvoiceSubscription[]) => {
  return data.map((invoiceSubscription) => {
    const currentSubscription = invoiceSubscription.subscription

    let formattedData: FormattedInvoiceSubscription = {
      currentSubscription,
      invoiceDisplayName: !!currentSubscription
        ? currentSubscription?.name || currentSubscription?.plan?.name
        : '',
      subscriptionFees: [],
      remainingFees: [],
    }

    if (!invoiceSubscription?.fees?.length) return formattedData

    // Build up data
    for (let i = 0; i < invoiceSubscription?.fees?.length; i++) {
      const currentFee = invoiceSubscription?.fees[i]

      // Prevent zero amount fees from being displayed
      if (currentFee.amountCents === 0) continue

      // Split fees into subscription fees and remaining fees depending on fee type
      if (currentFee.feeType === FeeTypesEnum.Subscription) {
        formattedData?.subscriptionFees?.push(currentFee)
      } else {
        // @ts-ignore
        formattedData?.remainingFees?.push(currentFee)
      }
    }

    // Format remaining fees
    if (formattedData?.remainingFees?.length) {
      formattedData.remainingFees = _deepFormatRemainingFees(
        formattedData.remainingFees as unknown as BaseFormattedInvoiceSubscription['remainingFees']
      )
    }
    return formattedData
  })
}

const _deepFormatRemainingFees = (
  remainingFees: BaseFormattedInvoiceSubscription['remainingFees']
) => {
  return Object.values(_groupBy(remainingFees, (fee) => fee?.charge?.id))
    .map((fees) => {
      let hasAnyGroup = false

      const feesData: ExtendedRemainingFee[] = []

      // Mark fees depending on their type and add a display name
      for (let i = 0; i < fees.length; i++) {
        const fee = fees[i]

        if (!!fee.group?.id) {
          hasAnyGroup = true

          feesData.push({
            ...fee,
            isGroupChildFee: true,
            displayName: `${!!fee.group?.key ? `${fee.group?.key} • ` : ''}${fee.group?.value}`,
          })
        } else if (!!fee?.trueUpParentFee?.id) {
          feesData.push({
            ...fee,
            isTrueUpFee: true,
            displayName: fee.charge?.billableMetric?.name || '',
          })
        } else {
          feesData.push({
            ...fee,
            isNormalFee: true,
            displayName: fee.charge?.billableMetric?.name || '',
          })
        }
      }

      // If any of the fees are grouped, add an extra fee that represents the total of all the grouped fees
      if (hasAnyGroup) {
        const totalUnits = feesData.reduce(
          (acc, cur) => (acc += cur.isTrueUpFee ? 0 : Number(cur.units)),
          0
        )

        feesData.push({
          ...fees[0],
          isGroupParentFee: true,
          displayName: `${feesData[0].charge?.billableMetric?.name || ''}`,
          units: totalUnits,
          amountCents: null,
        })
      }

      // return sorted feesData
      // - Normal fees
      // - Group parent fees
      // - Group child fees
      // - True-up fees
      return feesData.sort((a, b) => {
        if (!!a.isNormalFee && !b.isNormalFee) {
          return -1
        } else if (!a.isNormalFee && !!b.isNormalFee) {
          return 1
        } else if (!!a.isGroupParentFee && !b.isGroupParentFee) {
          return -1
        } else if (!a.isGroupParentFee && !!b.isGroupParentFee) {
          return 1
        } else if (!!a.isGroupChildFee && !b.isGroupChildFee) {
          return -1
        } else if (!a.isGroupChildFee && !!b.isGroupChildFee) {
          return 1
        } else if (!!a.isTrueUpFee && !b.isTrueUpFee) {
          return -1
        } else if (!a.isTrueUpFee && !!b.isTrueUpFee) {
          return 1
        }

        return 0
      })
    })
    .flat()
}

export default formatInvoiceItemsMap
