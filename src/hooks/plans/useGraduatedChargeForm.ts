import type { AnyFormApi } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'

import { LocalChargeFilterInput } from '~/components/plans/types'
import { ONE_TIER_EXAMPLE_UNITS } from '~/core/constants/form'
import { GraduatedRangeInput, PropertiesInput } from '~/generated/graphql'
import { formatAnyToValueForChargeFormArrays } from '~/hooks/plans/utils'

type RangeType = GraduatedRangeInput & { disabledDelete: boolean }
type InfoCalculationRow = {
  units: number
  perUnit: number
  flatFee: number
  total: number
  firstUnit?: string
}

type UseGraduatedChargeForm = ({
  disabled,
  propertyCursor,
  form,
  valuePointer,
}: {
  disabled?: boolean
  propertyCursor: string
  form: Pick<AnyFormApi, 'setFieldValue'>
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}) => {
  handleUpdate: (rangeIndex: number, fieldName: string, value?: number | string | string[]) => void
  addRange: () => void
  deleteRange: (rangeIndex: number) => void
  tableDatas: RangeType[]
  infosCalculation: InfoCalculationRow[]
}

export const GRADUATED_TIER_PRECISION_GAP = 0.01

const bumpByTierGap = (value: number | string) =>
  Number((Number(value || 0) + GRADUATED_TIER_PRECISION_GAP).toFixed(2))

export const DEFAULT_GRADUATED_CHARGES = [
  {
    fromValue: 0,
    toValue: 1,
    flatAmount: undefined,
    perUnitAmount: undefined,
  },
  {
    fromValue: 1.01,
    toValue: null,
    flatAmount: undefined,
    perUnitAmount: undefined,
  },
]

export const useGraduatedChargeForm: UseGraduatedChargeForm = ({
  disabled,
  form,
  propertyCursor,
  valuePointer,
}) => {
  const setFieldValue = (path: string, value: unknown) => form.setFieldValue(path, value)
  const attributeIdentifier = `${propertyCursor}.graduatedRanges`
  const graduatedRanges = useMemo(() => valuePointer?.graduatedRanges || [], [valuePointer])

  useEffect(() => {
    if (!graduatedRanges.length) {
      // if no existing charge, initialize it with 2 pre-filled lines
      setFieldValue(attributeIdentifier, DEFAULT_GRADUATED_CHARGES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeIdentifier])

  return {
    tableDatas: useMemo(
      () =>
        graduatedRanges.map((range, i) => {
          return {
            ...range,
            // First and last rows can't be deleted
            disabledDelete: [0].includes(i) || !!disabled,
          }
        }),
      [graduatedRanges, disabled],
    ),
    infosCalculation: useMemo(
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
              total: (graduatedRanges.length === 1 ? 10 : 1) * perUnit + flatFee,
            })

            const totalLine = {
              firstUnit:
                graduatedRanges.length === 1
                  ? `${ONE_TIER_EXAMPLE_UNITS}`
                  : String(Number(range.fromValue) || 0),
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
      [graduatedRanges],
    ),
    addRange: () => {
      const addIndex = graduatedRanges?.length - 1 // Add before the last range
      const newGraduatedRanges = graduatedRanges.reduce<Partial<GraduatedRangeInput>[]>(
        (acc, range, i) => {
          if (i < addIndex) {
            acc.push(range)
          } else if (i === addIndex) {
            const prevToValue =
              addIndex === 0 ? 0 : Number(graduatedRanges[addIndex - 1]?.toValue || 0)
            const newFromValue = addIndex === 0 ? 0 : bumpByTierGap(prevToValue)
            const newToValue = prevToValue + 1

            acc.push({
              fromValue: newFromValue,
              toValue: newToValue,
              flatAmount: undefined,
              perUnitAmount: undefined,
            })
            acc.push({
              ...range,
              fromValue:
                Number(range.fromValue || 0) <= newToValue
                  ? bumpByTierGap(newToValue)
                  : Number(range.fromValue),
            })
          }

          return acc
        },
        [],
      )

      setFieldValue(`${propertyCursor}.graduatedRanges`, newGraduatedRanges)
    },
    handleUpdate: (rangeIndex, fieldName, value) => {
      if (fieldName !== 'toValue') {
        setFieldValue(`${attributeIdentifier}.${rangeIndex}.${fieldName}`, value)
      } else {
        const newGraduatedRanges = graduatedRanges.reduce<GraduatedRangeInput[]>(
          (acc, range, i) => {
            if (rangeIndex === i) {
              acc.push({ ...range, toValue: Number(value || 0) })
            } else if (i > rangeIndex) {
              // fromValue should always be toValueOfPreviousRange + GRADUATED_TIER_PRECISION_GAP
              const { toValue } = acc[i - 1]
              const fromValue = bumpByTierGap(toValue || 0)
              const formattedToValue = formatAnyToValueForChargeFormArrays(
                range.toValue,
                fromValue,
                GRADUATED_TIER_PRECISION_GAP,
              )

              acc.push({
                ...range,
                fromValue,
                toValue: formattedToValue,
              })
            } else {
              acc.push(range)
            }

            return acc
          },
          [],
        )

        setFieldValue(attributeIdentifier, newGraduatedRanges)
      }
    },
    deleteRange: (rangeIndex) => {
      const newGraduatedRanges = graduatedRanges.reduce<GraduatedRangeInput[]>((acc, range, i) => {
        if (i < rangeIndex) acc.push({ ...range })
        // fromValue should always be toValueOfPreviousRange + GRADUATED_TIER_PRECISION_GAP
        if (i > rangeIndex) {
          const { toValue } = acc[acc.length - 1]

          acc.push({
            ...range,
            fromValue: bumpByTierGap(toValue || 0),
          })
        }
        return acc
      }, [])

      // Last row needs to has toValue null
      newGraduatedRanges[newGraduatedRanges.length - 1].toValue = null

      setFieldValue(attributeIdentifier, newGraduatedRanges)
    },
  }
}
