import { useEffect, useMemo } from 'react'
import { FormikProps } from 'formik'

import { PlanFormInput } from '~/components/plans/types'
import { VolumeRangeInput } from '~/generated/graphql'

export const DEFAULT_VOLUME_CHARGES = [
  {
    fromValue: 0,
    toValue: 1,
    flatAmount: undefined,
    perUnitAmount: undefined,
  },
  {
    fromValue: 2,
    toValue: null,
    flatAmount: undefined,
    perUnitAmount: undefined,
  },
]

type RangeType = VolumeRangeInput & { disabledDelete: boolean }
type InfoCalculationRow = {
  lastRowFirstUnit: number
  lastRowPerUnit: number
  lastRowFlatFee: number
  value: number
}

type UseVolumeChargeForm = ({
  formikProps,
  chargeIndex,
  disabled,
}: {
  formikProps: FormikProps<PlanFormInput>
  chargeIndex: number
  disabled?: boolean
}) => {
  handleUpdate: (rangeIndex: number, fieldName: string, value?: number | string) => void
  addRange: () => void
  deleteRange: (rangeIndex: number) => void
  tableDatas: RangeType[]
  infosCalculation: InfoCalculationRow
}

export const useVolumeChargeForm: UseVolumeChargeForm = ({
  formikProps,
  chargeIndex,
  disabled,
}) => {
  const formikIdentifier = `charges.${chargeIndex}.properties.volumeRanges`
  const volumeRanges = useMemo(
    () => formikProps.values.charges[chargeIndex].properties?.volumeRanges || [],
    [formikProps.values.charges, chargeIndex]
  )

  useEffect(() => {
    if (!volumeRanges.length) {
      // if no existing charge, initialize it with 2 pre-filled lines
      formikProps.setFieldValue(formikIdentifier, DEFAULT_VOLUME_CHARGES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    tableDatas: useMemo(
      () =>
        volumeRanges.map((range, i) => {
          return {
            ...range,
            // First and last rows can't be deleted
            disabledDelete: [0, volumeRanges.length - 1].includes(i) || !!disabled,
          }
        }),
      [volumeRanges, disabled]
    ),
    infosCalculation: useMemo(() => {
      const lastRow = volumeRanges[volumeRanges.length - 1]
      const lastRowFirstUnit = Number(lastRow?.fromValue || 0)
      const lastRowPerUnit = Number(lastRow?.perUnitAmount || 0)
      const lastRowFlatFee = Number(lastRow?.flatAmount || 0)
      const value = lastRowFirstUnit * lastRowPerUnit + lastRowFlatFee

      return { lastRowFirstUnit, lastRowPerUnit, lastRowFlatFee, value }
    }, [volumeRanges]),

    addRange: () => {
      const addIndex = volumeRanges?.length - 1 // Add before the last range
      const newVolumeRanges = volumeRanges.reduce<Partial<VolumeRangeInput>[]>((acc, range, i) => {
        if (i < addIndex) {
          acc.push(range)
        } else if (i === addIndex) {
          const newToValue = (volumeRanges[addIndex - 1]?.toValue || 0) + 1

          acc.push({
            fromValue: newToValue,
            toValue: newToValue + 1,
            flatAmount: undefined,
            perUnitAmount: undefined,
          })
          acc.push({
            ...range,
            fromValue: range.fromValue <= newToValue + 1 ? newToValue + 2 : range.fromValue,
          })
        }

        return acc
      }, [])

      formikProps.setFieldValue(`charges.${chargeIndex}.properties.volumeRanges`, newVolumeRanges)
    },
    handleUpdate: (rangeIndex, fieldName, value) => {
      const safeValue = Number(value || 0)

      if (fieldName !== 'toValue') {
        formikProps.setFieldValue(
          `${formikIdentifier}.${rangeIndex}.${fieldName}`,
          value !== '' ? Number(value) : value
        )
      } else {
        const newVolumeRanges = volumeRanges.reduce<VolumeRangeInput[]>((acc, range, i) => {
          if (rangeIndex === i) {
            acc.push({ ...range, toValue: safeValue })
          } else if (i > rangeIndex) {
            // fromValue should always be toValueOfPreviousRange + 1
            const { toValue } = acc[i - 1]
            const fromValue = (toValue || 0) + 1

            acc.push({
              ...range,
              fromValue,
              toValue:
                range.toValue === null
                  ? null
                  : (range.toValue || 0) <= fromValue
                  ? fromValue + 1
                  : range.toValue,
            })
          } else {
            acc.push(range)
          }

          return acc
        }, [])

        formikProps.setFieldValue(formikIdentifier, newVolumeRanges)
      }
    },
    deleteRange: (rangeIndex) => {
      const newVolumeRanges = volumeRanges.reduce<VolumeRangeInput[]>((acc, range, i) => {
        if (i < rangeIndex) acc.push(range)
        // fromValue should always be toValueOfPreviousRange + 1
        if (i > rangeIndex) {
          const { toValue } = acc[acc.length - 1]

          acc.push({
            ...range,
            fromValue: (toValue || 0) + 1,
          })
        }
        return acc
      }, [])

      formikProps.setFieldValue(formikIdentifier, newVolumeRanges)
    },
  }
}
