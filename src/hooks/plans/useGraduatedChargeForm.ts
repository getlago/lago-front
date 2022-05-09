import { useEffect, useMemo } from 'react'
import { FormikProps } from 'formik'

import { PlanFormInput } from '~/components/plans/types'
import { GraduatedRangeInput } from '~/generated/graphql'

type RangeType = GraduatedRangeInput & { disabledDelete: boolean }
type InfoCalculationRow = {
  units: number
  perUnitCent: number
  flatFeeCent: number
  totalCent: number
  firstUnit?: number
}

type UseGraduatedChargeForm = ({
  formikProps,
  chargeIndex,
}: {
  formikProps: FormikProps<PlanFormInput>
  chargeIndex: number
}) => {
  handleUpdate: (rangeIndex: number, fieldName: string, value?: number | string) => void
  addRange: () => void
  deleteRange: (rangeIndex: number) => void
  tableDatas: RangeType[]
  infosCaclucation: InfoCalculationRow[]
}

export const useGraduatedChargeForm: UseGraduatedChargeForm = ({ formikProps, chargeIndex }) => {
  const formikIdentifier = `charges.${chargeIndex}.graduatedRanges`
  const graduatedRanges = useMemo(
    () => formikProps.values.charges[chargeIndex].graduatedRanges || [],
    [formikProps.values.charges, chargeIndex]
  )

  useEffect(() => {
    if (!graduatedRanges.length) {
      // if no existing charge, initialize it with 2 pre-filled lines
      formikProps.setFieldValue(formikIdentifier, [
        {
          fromValue: 0,
          toValue: 1,
          flatAmountCents: undefined,
          perUnitAmountCents: undefined,
        },
        {
          fromValue: 2,
          toValue: null,
          flatAmountCents: undefined,
          perUnitAmountCents: undefined,
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    tableDatas: useMemo(
      () =>
        graduatedRanges.map((range, i) => {
          return {
            ...range,
            // First and last rows can't be deleted
            disabledDelete: [0, graduatedRanges.length - 1].includes(i),
          }
        }),
      [graduatedRanges]
    ),
    infosCaclucation: useMemo(
      () =>
        graduatedRanges.reduce<InfoCalculationRow[]>((acc, range, i) => {
          const units =
            i === 0
              ? range.toValue || 0
              : (range.toValue || 0) - (graduatedRanges[i - 1].toValue || 0)

          if (i < graduatedRanges.length - 1) {
            acc.push({
              units,
              perUnitCent: range.perUnitAmountCents || 0,
              flatFeeCent: range.flatAmountCents || 0,
              totalCent: (units * range.perUnitAmountCents || 0) + range.flatAmountCents || 0,
            })
          } else {
            acc.push({
              units: 1,
              perUnitCent: range.perUnitAmountCents || 0,
              flatFeeCent: range.flatAmountCents || 0,
              totalCent: (1 * range.perUnitAmountCents || 0) + range.flatAmountCents || 0,
            })

            const totalLine = {
              firstUnit: range.fromValue,
              totalCent: acc.reduce<number>((accTotal, rangeCost) => {
                return accTotal + rangeCost.totalCent
              }, 0),
              perUnitCent: 0,
              flatFeeCent: 0,
              units: 0,
            }

            acc.unshift(totalLine)
          }

          return acc
        }, []),
      [graduatedRanges]
    ),
    addRange: () => {
      const addIndex = graduatedRanges?.length - 1 // Add before the last range
      const newGraduatedRanges = graduatedRanges.reduce<Partial<GraduatedRangeInput>[]>(
        (acc, range, i) => {
          if (i < addIndex) {
            acc.push(range)
          } else if (i === addIndex) {
            const newToValue = (graduatedRanges[addIndex - 1]?.toValue || 0) + 1

            acc.push({
              fromValue: newToValue,
              toValue: newToValue + 1,
              flatAmountCents: undefined,
              perUnitAmountCents: undefined,
            })
            acc.push({
              ...range,
              fromValue: range.fromValue <= newToValue + 1 ? newToValue + 2 : range.fromValue,
            })
          }

          return acc
        },
        []
      )

      formikProps.setFieldValue(`charges.${chargeIndex}.graduatedRanges`, newGraduatedRanges)
    },
    handleUpdate: (rangeIndex, fieldName, value) => {
      const safeValue = Number(value || 0)

      if (fieldName !== 'toValue') {
        formikProps.setFieldValue(`${formikIdentifier}.${rangeIndex}.${fieldName}`, safeValue)
      } else {
        const newGraduatedRanges = graduatedRanges.reduce<GraduatedRangeInput[]>(
          (acc, range, i) => {
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
          },
          []
        )

        formikProps.setFieldValue(formikIdentifier, newGraduatedRanges)
      }
    },
    deleteRange: (rangeIndex) => {
      const newGraduatedRanges = graduatedRanges.reduce<GraduatedRangeInput[]>((acc, range, i) => {
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

      formikProps.setFieldValue(formikIdentifier, newGraduatedRanges)
    },
  }
}
