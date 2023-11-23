import _groupBy from 'lodash/groupBy'

import { Fee, FeeTypesEnum, InvoiceSubscription } from '~/generated/graphql'

export type ExtendedRemainingFee = Fee & {
  displayName: string
  isGroupChildFee?: boolean
  isTrueUpFee?: boolean
  isNormalFee?: boolean
}

interface BaseFormattedInvoiceSubscription {
  invoiceSubscription: InvoiceSubscription
  currentSubscription: InvoiceSubscription['subscription']
  invoiceDisplayName: string
  subscriptionFees: InvoiceSubscription['subscription']['fees']
  feesInArrears: InvoiceSubscription['subscription']['fees']
  feesInAdvance: InvoiceSubscription['subscription']['fees']
}

interface FormattedInvoiceSubscription
  extends Omit<BaseFormattedInvoiceSubscription, 'feesInArrears'> {
  feesInArrears: ExtendedRemainingFee[]
  feesInAdvance: ExtendedRemainingFee[]
}

const formatInvoiceItemsMap = (data: InvoiceSubscription[]) => {
  return data.map((invoiceSubscription) => {
    const currentSubscription = invoiceSubscription.subscription

    let formattedData: FormattedInvoiceSubscription = {
      invoiceSubscription,
      currentSubscription,
      invoiceDisplayName: !!currentSubscription
        ? currentSubscription?.name || currentSubscription?.plan?.name
        : '',
      subscriptionFees: [],
      feesInArrears: [],
      feesInAdvance: [],
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
      } else if (!currentFee?.charge?.payInAdvance) {
        // Charge paid in arrears
        // @ts-ignore
        formattedData?.feesInArrears?.push(currentFee)
      } else {
        // Charge paid in advance
        // @ts-ignore
        formattedData?.feesInAdvance?.push(currentFee)
      }
    }

    // Format fees
    if (formattedData?.feesInArrears?.length) {
      formattedData.feesInArrears = _deepFormatFees(
        formattedData.feesInArrears as unknown as BaseFormattedInvoiceSubscription['feesInArrears'],
      )
    }
    if (formattedData?.feesInAdvance?.length) {
      formattedData.feesInAdvance = _deepFormatFees(
        formattedData.feesInAdvance as unknown as BaseFormattedInvoiceSubscription['feesInAdvance'],
      )
    }
    return formattedData
  })
}

const _deepFormatFees = (
  feesToFormat:
    | BaseFormattedInvoiceSubscription['feesInArrears']
    | BaseFormattedInvoiceSubscription['feesInAdvance'],
) => {
  return Object.values(_groupBy(feesToFormat, (fee) => fee?.charge?.id))
    .map((fees) => {
      const feesData: ExtendedRemainingFee[] = []

      // Mark fees depending on their type and add a display name
      for (let i = 0; i < fees.length; i++) {
        const fee = fees[i]

        if (!!fee.group?.id) {
          feesData.push({
            ...fee,
            isGroupChildFee: true,
            displayName: `${`${fee.invoiceName || fee.charge?.billableMetric?.name} • `}${
              fee.groupName
                ? fee.groupName
                : `${!!fee.group?.key ? `${fee.group?.key} • ` : ''}${fee.group.value}`
            }`,
          })
        } else if (!!fee?.trueUpParentFee?.id) {
          feesData.push({
            ...fee,
            isTrueUpFee: true,
            displayName: fee.groupName || fee.invoiceName || fee.charge?.billableMetric?.name || '',
          })
        } else {
          feesData.push({
            ...fee,
            isNormalFee: true,
            displayName: fee.invoiceName || fee.charge?.billableMetric?.name || '',
          })
        }
      }

      // return sorted feesData
      // - Normal fees
      // - Group child fees
      // - True-up fees
      return feesData.sort((a, b) => {
        if (!!a.isNormalFee && !b.isNormalFee) {
          return -1
        } else if (!a.isNormalFee && !!b.isNormalFee) {
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
