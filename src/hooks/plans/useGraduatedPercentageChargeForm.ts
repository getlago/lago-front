import { FormikProps } from 'formik'
import { useEffect, useMemo } from 'react'

import { PlanFormInput } from '~/components/plans/types'
import { GraduatedPercentageRangeInput, InputMaybe, PropertiesInput } from '~/generated/graphql'

type RangeType = GraduatedPercentageRangeInput & { disabledDelete: boolean }
type InfoCalculationRow = {
  units: number
  rate: number
  flatAmount: number
}

type useGraduatedPercentageChargeForm = ({
  formikProps,
  chargeIndex,
  disabled,
  propertyCursor,
  valuePointer,
}: {
  chargeIndex: number
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
}) => {
  handleUpdate: (rangeIndex: number, fieldName: string, value?: number | string) => void
  addRange: () => void
  deleteRange: (rangeIndex: number) => void
  tableDatas: RangeType[]
  infosCalculation: InfoCalculationRow[]
}

export const DEFAULT_GRADUATED_PERCENTAGE_CHARGES = [
  {
    fromValue: '0',
    toValue: '1',
    rate: undefined,
    flatAmount: undefined,
  },
  {
    fromValue: '2',
    toValue: null,
    rate: undefined,
    flatAmount: undefined,
  },
]

export const useGraduatedPercentageChargeForm: useGraduatedPercentageChargeForm = ({
  chargeIndex,
  disabled,
  formikProps,
  propertyCursor,
  valuePointer,
}) => {
  const formikIdentifier = `charges.${chargeIndex}.${propertyCursor}.graduatedPercentageRanges`
  const graduatedPercentageRanges = useMemo(
    () => valuePointer?.graduatedPercentageRanges || [],
    [valuePointer],
  )

  useEffect(() => {
    if (!graduatedPercentageRanges.length) {
      // if no existing charge, initialize it with 2 pre-filled lines
      formikProps.setFieldValue(formikIdentifier, DEFAULT_GRADUATED_PERCENTAGE_CHARGES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikIdentifier])

  return {
    tableDatas: useMemo(
      () =>
        graduatedPercentageRanges.map((range, i) => {
          return {
            ...range,
            // First and last rows can't be deleted
            disabledDelete: [0].includes(i) || !!disabled,
          }
        }),
      [graduatedPercentageRanges, disabled],
    ),
    infosCalculation: useMemo(
      () =>
        graduatedPercentageRanges.reduce<InfoCalculationRow[]>((acc, range, i) => {
          const units =
            i === 0
              ? Number(range.toValue || 0)
              : Number(graduatedPercentageRanges[i - 1].toValue || 0)
          const rate = Number(range.rate || 0)
          const flatAmount = Number(range.flatAmount || 0)

          acc.push({
            units,
            rate,
            flatAmount,
          })

          return acc
        }, []),
      [graduatedPercentageRanges],
    ),
    addRange: () => {
      const addIndex = graduatedPercentageRanges?.length - 1 // Add before the last range
      const newgraduatedPercentageRanges = graduatedPercentageRanges.reduce<
        Partial<GraduatedPercentageRangeInput>[]
      >((acc, range, i) => {
        if (i < addIndex) {
          acc.push(range)
        } else if (i === addIndex) {
          const newToValue =
            addIndex === 0
              ? '0'
              : String(Number(graduatedPercentageRanges[addIndex - 1]?.toValue || 0) + 1)

          acc.push({
            fromValue: newToValue,
            toValue: String(Number(newToValue) + 1),
            rate: '',
            flatAmount: undefined,
          })
          acc.push({
            ...range,
            fromValue:
              Number(range.fromValue || 0) <= Number(newToValue) + 1
                ? String(Number(newToValue) + 2)
                : String(range.fromValue),
          })
        }

        return acc
      }, [])

      formikProps.setFieldValue(
        `charges.${chargeIndex}.${propertyCursor}.graduatedPercentageRanges`,
        newgraduatedPercentageRanges,
      )
    },
    handleUpdate: (rangeIndex, fieldName, value) => {
      if (fieldName !== 'toValue') {
        formikProps.setFieldValue(
          `${formikIdentifier}.${rangeIndex}.${fieldName}`,
          value !== '' ? Number(value) : value,
        )
      } else {
        const newgraduatedPercentageRanges = graduatedPercentageRanges.reduce<
          GraduatedPercentageRangeInput[]
        >((acc, range, i) => {
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

        formikProps.setFieldValue(formikIdentifier, newgraduatedPercentageRanges)
      }
    },
    deleteRange: (rangeIndex) => {
      const newgraduatedPercentageRanges = graduatedPercentageRanges.reduce<
        GraduatedPercentageRangeInput[]
      >((acc, range, i) => {
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

      // Last row needs to has toValue equal to null (infinite)
      newgraduatedPercentageRanges[newgraduatedPercentageRanges.length - 1].toValue = null

      formikProps.setFieldValue(formikIdentifier, newgraduatedPercentageRanges)
    },
  }
}
