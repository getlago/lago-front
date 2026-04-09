import type { AnyFormApi } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'

import { LocalChargeFilterInput } from '~/components/plans/types'
import { ONE_TIER_EXAMPLE_UNITS } from '~/core/constants/form'
import { GraduatedRangeInput, PropertiesInput } from '~/generated/graphql'
import {
  buildRangesForAdd,
  buildRangesForDelete,
  buildRangesForToValueUpdate,
} from '~/hooks/plans/utils'

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

export const DEFAULT_GRADUATED_CHARGES = [
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
      const newRanges = buildRangesForAdd(graduatedRanges, {
        flatAmount: undefined,
        perUnitAmount: undefined,
      })

      setFieldValue(`${propertyCursor}.graduatedRanges`, newRanges)
    },
    handleUpdate: (rangeIndex, fieldName, value) => {
      if (fieldName !== 'toValue') {
        setFieldValue(`${attributeIdentifier}.${rangeIndex}.${fieldName}`, value)
      } else {
        setFieldValue(
          attributeIdentifier,
          buildRangesForToValueUpdate(graduatedRanges, rangeIndex, value as number | string),
        )
      }
    },
    deleteRange: (rangeIndex) => {
      setFieldValue(attributeIdentifier, buildRangesForDelete(graduatedRanges, rangeIndex))
    },
  }
}
