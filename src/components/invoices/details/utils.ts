import { ComboBoxProps } from '~/components/form'
import { ALL_FILTER_VALUES } from '~/core/constants/form'
import {
  composeChargeFilterDisplayName,
  TSubscriptionDataForDisplay,
} from '~/core/formats/formatInvoiceItemsMap'
import { InvoiceSubscriptionForCreateFeeDrawerFragment } from '~/generated/graphql'

export const getChargesComboboxDataFromInvoiceSubscription = ({
  invoiceSubscription,
}: {
  invoiceSubscription: InvoiceSubscriptionForCreateFeeDrawerFragment | undefined
}): ComboBoxProps['data'] => {
  if (!invoiceSubscription) return []
  // Create charge list
  const planChargesWithoutAssociatedFees = invoiceSubscription.subscription.plan.charges?.filter(
    (charge) => {
      const chargeFeeExistsInAllFees = !invoiceSubscription?.fees?.some(
        (invoiceSubFee) => invoiceSubFee.charge?.id === charge.id && !invoiceSubFee.chargeFilter,
      )

      // If charge has no filters
      if (!charge.filters?.length) return chargeFeeExistsInAllFees
      // If charge has filters, check if all filters are associated with a charge
      return charge.filters?.some((filter) => {
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
    },
  )

  return (planChargesWithoutAssociatedFees || []).map((planChargesWithoutAssociatedFee) => {
    const { billableMetric, id, invoiceDisplayName } = planChargesWithoutAssociatedFee

    return {
      label: invoiceDisplayName || billableMetric?.name,
      description: billableMetric?.code,
      value: id,
    }
  })
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
