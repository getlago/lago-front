import { ComboboxDataGrouped, ComboBoxProps } from '~/components/form'
import { ALL_FILTER_VALUES } from '~/core/constants/form'
import {
  composeChargeFilterDisplayName,
  TSubscriptionDataForDisplay,
} from '~/core/formats/formatInvoiceItemsMap'
import { InvoiceSubscriptionForCreateFeeDrawerFragment } from '~/generated/graphql'

function _formatChargeDataForCombobox(
  charge: NonNullable<
    InvoiceSubscriptionForCreateFeeDrawerFragment['subscription']['plan']['charges']
  >[number],
  groupLabel: string,
): ComboboxDataGrouped {
  const { id, invoiceDisplayName, billableMetric } = charge

  return {
    label: invoiceDisplayName || billableMetric?.name,
    description: billableMetric?.code,
    value: id,
    group: groupLabel,
  }
}

function _formatFixedChargeDataForCombobox(
  fixedCharge: NonNullable<
    InvoiceSubscriptionForCreateFeeDrawerFragment['subscription']['plan']['fixedCharges']
  >[number],
  groupLabel: string,
): ComboboxDataGrouped {
  const { id, invoiceDisplayName, addOn } = fixedCharge

  return {
    label: invoiceDisplayName || addOn?.name || '',
    description: addOn?.code,
    value: id,
    group: groupLabel,
  }
}

export const getChargesComboboxDataFromInvoiceSubscription = ({
  chargesGroupLabel,
  fixedChargesGroupLabel,
  invoiceSubscription,
}: {
  chargesGroupLabel: string
  fixedChargesGroupLabel: string
  invoiceSubscription: InvoiceSubscriptionForCreateFeeDrawerFragment | undefined
}): ComboBoxProps['data'] => {
  if (!invoiceSubscription) return []

  const planUsageChargesWithoutAssociatedFees =
    invoiceSubscription.subscription.plan.charges?.reduce<ComboboxDataGrouped[]>((acc, charge) => {
      const chargeFeeExistsInAllFees = !invoiceSubscription?.fees?.some(
        (invoiceSubFee) => invoiceSubFee.charge?.id === charge.id && !invoiceSubFee.chargeFilter,
      )

      if (!charge.filters?.length) {
        if (chargeFeeExistsInAllFees)
          acc.push(_formatChargeDataForCombobox(charge, chargesGroupLabel))
        return acc
      }

      const hasAvailableFilter = charge.filters?.some((filter) => {
        const defaultFilterExistsInAllFees = invoiceSubscription?.fees?.find(
          (invoiceSubFee) =>
            invoiceSubFee.charge?.id === charge.id &&
            !invoiceSubFee.chargeFilter &&
            !!invoiceSubFee.charge.filters,
        )
        const chargeFilterExistsInAllFees = invoiceSubscription?.fees?.some(
          (invoiceSubFee) =>
            invoiceSubFee.charge?.id === charge.id && invoiceSubFee.chargeFilter?.id === filter.id,
        )

        return !chargeFilterExistsInAllFees || !defaultFilterExistsInAllFees
      })

      if (!hasAvailableFilter) return acc

      return [...acc, _formatChargeDataForCombobox(charge, chargesGroupLabel)]
    }, [])

  const planFixedChargesWithoutAssociatedFees =
    invoiceSubscription.subscription.plan.fixedCharges?.reduce<ComboboxDataGrouped[]>(
      (acc, fixedCharge) => {
        const fixedChargeFeeExistsInAllFees = !invoiceSubscription?.fees?.some(
          (invoiceSubFee) => invoiceSubFee.fixedCharge?.id === fixedCharge.id,
        )

        if (!fixedChargeFeeExistsInAllFees) return acc

        return [...acc, _formatFixedChargeDataForCombobox(fixedCharge, fixedChargesGroupLabel)]
      },
      [],
    )

  return [
    ...(planFixedChargesWithoutAssociatedFees || []),
    ...(planUsageChargesWithoutAssociatedFees || []),
  ]
}

export const getChargesFiltersComboboxDataFromInvoiceSubscription = ({
  defaultFilterOptionLabel,
  invoiceSubscription,
  selectedChargeId,
}: {
  defaultFilterOptionLabel: string
  invoiceSubscription: InvoiceSubscriptionForCreateFeeDrawerFragment | undefined
  selectedChargeId: string | null | undefined
}): ComboBoxProps['data'] => {
  if (!invoiceSubscription || !selectedChargeId) return []

  const selectedCharge = invoiceSubscription.subscription.plan.charges?.find(
    (charge) => charge.id === selectedChargeId,
  )

  if (!selectedCharge?.filters?.length) return []

  const selectedPlanChargeFiltersWithoutAssociatedFees = selectedCharge.filters.filter((filter) => {
    const associatedFee = invoiceSubscription?.fees?.some(
      (invoiceSubFee) =>
        invoiceSubFee.charge?.id === selectedCharge.id &&
        invoiceSubFee.chargeFilter?.id === filter.id,
    )

    return !associatedFee
  })

  // Check if default filter is associated with a charge
  const defaultFilterExistsInAllFees = invoiceSubscription?.fees?.find(
    (invoiceSubFee) =>
      invoiceSubFee.charge?.id === selectedCharge.id &&
      !invoiceSubFee.chargeFilter &&
      !!invoiceSubFee.charge.filters,
  )

  const comboboxData = (selectedPlanChargeFiltersWithoutAssociatedFees || []).map(
    (planChargesWithoutAssociatedFee) => {
      const { id, invoiceDisplayName } = planChargesWithoutAssociatedFee

      const paddedDisplayValues: string =
        invoiceDisplayName || composeChargeFilterDisplayName(planChargesWithoutAssociatedFee)

      return {
        label: paddedDisplayValues,
        value: id,
      }
    },
  )

  if (!defaultFilterExistsInAllFees) {
    // Add the default value at the beginning of the list
    comboboxData.unshift({
      label: defaultFilterOptionLabel,
      value: ALL_FILTER_VALUES,
    })
  }

  return comboboxData
}

export const subscriptionTimestamps = ({
  advance,
  arrears,
  subscription,
}: {
  advance: boolean
  arrears: boolean
  subscription: TSubscriptionDataForDisplay['subscription']
}) => {
  if (!subscription?.metadata) {
    return { from: '', to: '' }
  }

  const {
    differentBoundariesForSubscriptionAndCharges: differentBoundaries,
    isMonthlyBilled,
    fromDatetime: subFromDatetime,
    toDatetime: subToDatetime,
    chargesFromDatetime,
    chargesToDatetime,
    inAdvanceChargesFromDatetime,
    inAdvanceChargesToDatetime,
  } = subscription.metadata

  if (advance) {
    if (inAdvanceChargesFromDatetime && inAdvanceChargesToDatetime) {
      return {
        from: inAdvanceChargesFromDatetime,
        to: inAdvanceChargesToDatetime,
      }
    }

    if (differentBoundaries) {
      return {
        from: subFromDatetime,
        to: subToDatetime,
      }
    }

    if (isMonthlyBilled) {
      return {
        from: chargesFromDatetime,
        to: chargesToDatetime,
      }
    }
  }

  if (arrears) {
    if (chargesFromDatetime === chargesToDatetime) {
      return {
        from: subFromDatetime,
        to: subToDatetime,
      }
    }

    if (differentBoundaries || isMonthlyBilled) {
      return {
        from: chargesFromDatetime,
        to: chargesToDatetime,
      }
    }
  }

  return {
    from: subFromDatetime,
    to: subToDatetime,
  }
}
