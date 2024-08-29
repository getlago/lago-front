import { FormikProps } from 'formik'
import { useEffect, useState } from 'react'

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
  const [errorIndex, setErrorIndex] = useState<number | undefined>()
  const { nonRecurringUsageThresholds, recurringUsageThreshold } = formikProps.values

  useEffect(() => {
    let failedIndex = undefined

    nonRecurringUsageThresholds?.every((row, index) => {
      if (
        (index > 0 && row.amountCents <= nonRecurringUsageThresholds[index - 1].amountCents) ||
        row.amountCents === undefined
      ) {
        failedIndex = index
        return false
      }

      return true
    })

    setErrorIndex(failedIndex)
  }, [nonRecurringUsageThresholds])

  const addNonRecurringThreshold = () => {
    const thresholds = [...(nonRecurringUsageThresholds ?? [])]
    const lastThreshold = thresholds[thresholds.length - 1]

    // If there is a threshold, add a new one with an amount 1 cent higher
    if (lastThreshold) {
      thresholds.push({
        amountCents: (lastThreshold.amountCents ?? 0) + 1,
        recurring: false,
      })
    } else {
      // If there is no threshold, add the default one
      thresholds.push(DEFAULT_PROGRESSIVE_BILLING)
    }

    // Update the formik values with the new thresholds and the recurring ones
    formikProps.setFieldValue('nonRecurringUsageThresholds', thresholds)
  }

  const addRecurringThreshold = () => {
    const initialRecurringThreshold = recurringUsageThreshold ?? {
      ...DEFAULT_PROGRESSIVE_BILLING,
      recurring: true,
    }

    formikProps.setFieldValue('recurringUsageThreshold', initialRecurringThreshold)
  }

  const deleteProgressiveBilling = () => {
    formikProps.setFieldValue('nonRecurringUsageThresholds', undefined)
    formikProps.setFieldValue('recurringUsageThreshold', undefined)
  }

  const deleteThreshold = ({ index, isRecurring }: { index: number; isRecurring: boolean }) => {
    if (isRecurring) {
      formikProps.setFieldValue('recurringUsageThreshold', undefined)
    } else {
      const newThresholds = nonRecurringUsageThresholds?.filter((_, i) => i !== index)

      formikProps.setFieldValue('nonRecurringUsageThresholds', newThresholds)
    }
  }

  const updateThreshold = ({
    index,
    isRecurring,
    key,
    value,
  }: {
    index?: number
    isRecurring: boolean
    key: keyof UsageThresholdInput
    value: unknown
  }) => {
    if (isRecurring) {
      formikProps.setFieldValue(`recurringUsageThreshold.${key}`, value)
    } else {
      formikProps.setFieldValue(`nonRecurringUsageThresholds.${index}.${key}`, value)
    }
  }

  return {
    nonRecurringUsageThresholds,
    recurringUsageThreshold,
    hasErrorInGroup: !!formikProps?.errors?.nonRecurringUsageThresholds,
    addNonRecurringThreshold,
    addRecurringThreshold,
    deleteThreshold,
    deleteProgressiveBilling,
    updateThreshold,
    errorIndex,
  }
}
