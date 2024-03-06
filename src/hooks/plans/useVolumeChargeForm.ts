import { FormikProps } from 'formik'
import { useEffect, useMemo } from 'react'

import {
  LocalChargeFilterInput,
  LocalPropertiesInput,
  PlanFormInput,
} from '~/components/plans/types'
import { ONE_TIER_EXAMPLE_UNITS } from '~/core/constants/form'
import { VolumeRangeInput } from '~/generated/graphql'

export const DEFAULT_VOLUME_CHARGES = [
  {
    fromValue: '0',
    toValue: '1',
    flatAmount: undefined,
    perUnitAmount: undefined,
  },
  {
    fromValue: '2',
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
  chargeIndex,
  disabled,
  formikProps,
  propertyCursor,
  valuePointer,
}: {
  chargeIndex: number
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
}) => {
  handleUpdate: (rangeIndex: number, fieldName: string, value?: number | string) => void
  addRange: () => void
  deleteRange: (rangeIndex: number) => void
  tableDatas: RangeType[]
  infosCalculation: InfoCalculationRow
}

export const useVolumeChargeForm: UseVolumeChargeForm = ({
  chargeIndex,
  disabled,
  formikProps,
  propertyCursor,
  valuePointer,
}) => {
  const formikIdentifier = `charges.${chargeIndex}.${propertyCursor}.volumeRanges`
  const volumeRanges = useMemo(() => valuePointer?.volumeRanges || [], [valuePointer])

  useEffect(() => {
    if (!volumeRanges.length) {
      // if no existing charge, initialize it with 2 pre-filled lines
      formikProps.setFieldValue(formikIdentifier, DEFAULT_VOLUME_CHARGES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikIdentifier])

  return {
    tableDatas: useMemo(
      () =>
        volumeRanges.map((range, i) => {
          return {
            ...range,
            // First and last rows can't be deleted
            disabledDelete: [0].includes(i) || !!disabled,
          }
        }),
      [volumeRanges, disabled],
    ),
    infosCalculation: useMemo(() => {
      const lastRow = volumeRanges[volumeRanges.length - 1]
      const lastRowFirstUnit =
        volumeRanges.length === 1 ? ONE_TIER_EXAMPLE_UNITS : Number(lastRow?.fromValue || 0)
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
          const newToValue =
            addIndex === 0 ? '0' : String(Number(volumeRanges[addIndex - 1]?.toValue || 0) + 1)

          acc.push({
            fromValue: newToValue,
            toValue: String(Number(newToValue) + 1),
            flatAmount: undefined,
            perUnitAmount: undefined,
          })
          acc.push({
            ...range,
            fromValue:
              Number(range.fromValue) <= Number(newToValue) + 1
                ? String(Number(newToValue) + 2)
                : String(range.fromValue),
          })
        }

        return acc
      }, [])

      formikProps.setFieldValue(
        `charges.${chargeIndex}.${propertyCursor}.volumeRanges`,
        newVolumeRanges,
      )
    },
    handleUpdate: (rangeIndex, fieldName, value) => {
      if (fieldName !== 'toValue') {
        formikProps.setFieldValue(
          `${formikIdentifier}.${rangeIndex}.${fieldName}`,
          value !== '' ? Number(value) : value,
        )
      } else {
        const newVolumeRanges = volumeRanges.reduce<VolumeRangeInput[]>((acc, range, i) => {
          if (rangeIndex === i) {
            acc.push({ ...range, toValue: String(Number(value || 0)) })
          } else if (i > rangeIndex) {
            // fromValue should always be toValueOfPreviousRange + 1
            const { toValue } = acc[i - 1]
            const fromValue = String(Number(toValue || 0) + 1)

            acc.push({
              ...range,
              fromValue,
              toValue:
                range.toValue === null
                  ? null
                  : Number(range.toValue || 0) <= Number(fromValue)
                    ? String(Number(fromValue) + 1)
                    : String(range.toValue || 0),
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
        if (i < rangeIndex) acc.push({ ...range })
        // fromValue should always be toValueOfPreviousRange + 1
        if (i > rangeIndex) {
          const { toValue } = acc[acc.length - 1]

          acc.push({
            ...range,
            fromValue: String(Number(toValue || 0) + 1),
          })
        }
        return acc
      }, [])

      // Last row needs to has toValue null
      newVolumeRanges[newVolumeRanges.length - 1].toValue = null

      formikProps.setFieldValue(formikIdentifier, newVolumeRanges)
    },
  }
}
