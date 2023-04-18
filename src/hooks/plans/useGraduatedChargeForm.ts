import { useEffect, useMemo } from 'react'
import { FormikProps } from 'formik'

import { PlanFormInput } from '~/components/plans/types'
import { GraduatedRangeInput, InputMaybe, PropertiesInput } from '~/generated/graphql'

type RangeType = GraduatedRangeInput & { disabledDelete: boolean }
type InfoCalculationRow = {
  units: number
  perUnit: number
  flatFee: number
  total: number
  firstUnit?: string
}

type UseGraduatedChargeForm = ({
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
  infosCaclucation: InfoCalculationRow[]
}

export const DEFAULT_GRADUATED_CHARGES = [
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

export const useGraduatedChargeForm: UseGraduatedChargeForm = ({
  chargeIndex,
  disabled,
  formikProps,
  propertyCursor,
  valuePointer,
}) => {
  const formikIdentifier = `charges.${chargeIndex}.${propertyCursor}.graduatedRanges`
  const graduatedRanges = useMemo(() => valuePointer?.graduatedRanges || [], [valuePointer])

  useEffect(() => {
    if (!graduatedRanges.length) {
      // if no existing charge, initialize it with 2 pre-filled lines
      formikProps.setFieldValue(formikIdentifier, DEFAULT_GRADUATED_CHARGES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikIdentifier])

  return {
    tableDatas: useMemo(
      () =>
        graduatedRanges.map((range, i) => {
          return {
            ...range,
            // First and last rows can't be deleted
            disabledDelete: [0, graduatedRanges.length - 1].includes(i) || !!disabled,
          }
        }),
      [graduatedRanges, disabled]
    ),
    infosCaclucation: useMemo(
      () =>
        graduatedRanges.reduce<InfoCalculationRow[]>((acc, range, i) => {
          const units =
            i === 0
              ? Number(range.toValue || 0)
              : Number(range.toValue || 0) - Number(graduatedRanges[i - 1].toValue || 0)
          const perUnit = Number(range.perUnitAmount || 0)
          const flatFee = Number(range.flatAmount || 0)

          if (i < graduatedRanges.length - 1) {
            acc.push({
              units,
              perUnit,
              flatFee,
              total: units * perUnit + flatFee,
            })
          } else {
            acc.push({
              units: 1,
              perUnit,
              flatFee,
              total: 1 * perUnit + flatFee,
            })

            const totalLine = {
              firstUnit: String(Number(range.fromValue) || 0),
              total: acc.reduce<number>((accTotal, rangeCost) => {
                return accTotal + rangeCost.total
              }, 0),
              perUnit: 0,
              flatFee: 0,
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
            const newToValue = String(Number(graduatedRanges[addIndex - 1]?.toValue || 0) + 1)

            acc.push({
              fromValue: newToValue,
              toValue: String(Number(newToValue) + 1),
              flatAmount: undefined,
              perUnitAmount: undefined,
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
        },
        []
      )

      formikProps.setFieldValue(
        `charges.${chargeIndex}.${propertyCursor}.graduatedRanges`,
        newGraduatedRanges
      )
    },
    handleUpdate: (rangeIndex, fieldName, value) => {
      if (fieldName !== 'toValue') {
        formikProps.setFieldValue(
          `${formikIdentifier}.${rangeIndex}.${fieldName}`,
          value !== '' ? Number(value) : value
        )
      } else {
        const newGraduatedRanges = graduatedRanges.reduce<GraduatedRangeInput[]>(
          (acc, range, i) => {
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
            fromValue: String(Number(toValue || 0) + 1),
          })
        }
        return acc
      }, [])

      formikProps.setFieldValue(formikIdentifier, newGraduatedRanges)
    },
  }
}
