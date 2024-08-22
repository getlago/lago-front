import { FormikProps } from 'formik'
import { useMemo } from 'react'

import { PlanFormInput } from '~/components/plans/types'
import { UsageThresholdInput } from '~/generated/graphql'

const DEFAULT_PROGRESSIVE_BILLING: UsageThresholdInput = {
  amountCents: 1,
  recurring: false,
}

export const useProgressiveBillingForm = ({
  formikProps,
}: {
  formikProps: FormikProps<PlanFormInput>
}) => {
  const { nonRecurring, recurring } = useMemo(() => {
    const table = formikProps.values.usageThresholds ?? []

    // Split the thresholds between recurring and non-recurring data
    return table.reduce<{
      recurring: UsageThresholdInput[]
      nonRecurring: UsageThresholdInput[]
    }>(
      (acc, threshold) => {
        if (threshold.recurring) {
          return {
            ...acc,
            recurring: [threshold],
          }
        }
        return {
          ...acc,
          nonRecurring: [...(acc.nonRecurring ?? []), threshold],
        }
      },
      { recurring: [], nonRecurring: [] },
    )
  }, [formikProps.values.usageThresholds])

  const addThreshold = () => {
    const newThresholds = [...nonRecurring]
    const lastThreshold = nonRecurring[nonRecurring.length - 1]

    // If there is a threshold, add a new one with an amount 1 cent higher
    if (lastThreshold) {
      newThresholds.push({
        amountCents: lastThreshold.amountCents + 1,
        recurring: false,
      })
    } else {
      // If there is no threshold, add the default one
      newThresholds.push(DEFAULT_PROGRESSIVE_BILLING)
    }

    // Update the formik values with the new thresholds and the recurring ones
    formikProps.setFieldValue('usageThresholds', [...newThresholds, ...recurring])
  }

  const deleteThreshold = ({ index, isRecurring }: { index: number; isRecurring: boolean }) => {
    const newThresholds = isRecurring
      ? // If the threshold is recurring, recurring list becomes empty
        [...nonRecurring]
      : // Remove the threshold from the non-recurring list at the given index
        [...recurring, ...nonRecurring.filter((_, i) => i !== index)]

    formikProps.setFieldValue('usageThresholds', newThresholds)
  }

  const deleteProgressiveBilling = () => {
    formikProps.setFieldValue('usageThresholds', undefined)
  }

  const addRecurring = () => {
    formikProps.setFieldValue('usageThresholds', [
      ...nonRecurring,
      {
        ...DEFAULT_PROGRESSIVE_BILLING,
        recurring: true,
      },
    ])
  }

  const handleUpdateThreshold = ({
    index,
    value,
    isRecurring,
    key,
  }: {
    index: number
    value: string | number | undefined
    isRecurring: boolean
    key: keyof UsageThresholdInput
  }) => {
    if (isRecurring) {
      const currentRecurringValue = formikProps.values.usageThresholds?.findIndex(
        (threshold) => !!threshold.recurring,
      )

      formikProps.setFieldValue(`usageThresholds[${currentRecurringValue}][${key}]`, value)
    } else {
      formikProps.setFieldValue(`usageThresholds[${index}][${key}]`, value)
    }
  }

  return {
    tableData: nonRecurring,
    recurringData: recurring,
    addThreshold,
    addRecurring,
    deleteThreshold,
    deleteProgressiveBilling,
    handleUpdateThreshold,
  }
}
