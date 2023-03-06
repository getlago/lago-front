import { act, renderHook } from '@testing-library/react'
import { useFormik } from 'formik'

import { PlanFormInput } from '~/components/plans/types'
import {
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  GraduatedRangeInput,
  AggregationTypeEnum,
} from '~/generated/graphql'

import { DEFAULT_GRADUATED_CHARGES, useGraduatedChargeForm } from '../useGraduatedChargeForm'

type PrepareType = {
  chargeIndex?: number
  disabled?: boolean
  graduatedRanges?: GraduatedRangeInput[]
  groupPropertyIndex?: number
  propertyType?: 'properties' | 'groupProperties'
}

const prepare = async ({
  chargeIndex = 0,
  disabled = false,
  graduatedRanges = [],
  groupPropertyIndex = 0,
  propertyType = 'properties',
}: PrepareType) => {
  const { result } = renderHook(() => {
    const formikProps = useFormik<PlanFormInput>({
      initialValues: {
        amountCents: 1,
        amountCurrency: CurrencyEnum.Usd,
        code: 'graduated',
        interval: PlanInterval.Monthly,
        name: 'graduated',
        payInAdvance: false,
        charges: [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              id: '1',
              name: 'graduated',
              aggregationType: AggregationTypeEnum.CountAgg,
              code: 'graduated',
              flatGroups:
                propertyType === 'groupProperties'
                  ? [{ id: '1', key: null, value: 'France' }]
                  : undefined,
            },
            properties: propertyType === 'properties' ? { graduatedRanges } : undefined,
            groupProperties:
              propertyType === 'groupProperties'
                ? [{ groupId: '1', values: { graduatedRanges: [...graduatedRanges] } }]
                : undefined,
          },
        ],
      },
      onSubmit: () => {},
    })
    const localCharge = formikProps.values.charges[chargeIndex]
    const propertyCursor = localCharge?.billableMetric?.flatGroups?.length
      ? `groupProperties.${groupPropertyIndex}.values`
      : 'properties'
    const valuePointer =
      localCharge?.billableMetric?.flatGroups?.length && localCharge?.groupProperties
        ? localCharge?.groupProperties[groupPropertyIndex].values
        : localCharge?.properties

    return useGraduatedChargeForm({
      formikProps,
      chargeIndex,
      disabled,
      propertyCursor,
      valuePointer,
    })
  })

  // Needed to fix warning about useEffect hook being re-rendering the renderHook test component
  // It makes the result being a Promise
  await act(() => Promise.resolve())

  return { result }
}

describe('useGraduatedRange()', () => {
  describe('with properties', () => {
    describe('tableDatas', () => {
      it('returns default datas if no charges defined', async () => {
        const { result } = await prepare({})

        expect(result.current.tableDatas).toStrictEqual(
          DEFAULT_GRADUATED_CHARGES.map((row) => ({ ...row, disabledDelete: true }))
        )

        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 2,
            total: 0,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
        ])
      })

      it('should add empty line with good calculation', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.addRange())

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: 0,
            toValue: 1,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
          {
            fromValue: 2,
            toValue: 3,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: false,
          },
          {
            fromValue: 4,
            toValue: null,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
        ])
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 4,
            total: 0,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 2,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
        ])
      })

      it('should handle update of row data and calculation', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.handleUpdate(0, 'flatAmount', '4'))
        await act(async () => await result.current.handleUpdate(1, 'perUnitAmount', '5'))

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: 0,
            toValue: 1,
            flatAmount: 4,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
          {
            fromValue: 2,
            toValue: null,
            flatAmount: undefined,
            perUnitAmount: 5,
            disabledDelete: true,
          },
        ])

        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 2,
            total: 9,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 4,
            total: 4,
          },
          {
            units: 1,
            perUnit: 5,
            flatFee: 0,
            total: 5,
          },
        ])
        await act(async () => await result.current.addRange())
        await act(async () => await result.current.handleUpdate(1, 'perUnitAmount', '8'))
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 4,
            total: 25,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 4,
            total: 4,
          },
          {
            units: 2,
            perUnit: 8,
            flatFee: 0,
            total: 16,
          },
          {
            units: 1,
            perUnit: 5,
            flatFee: 0,
            total: 5,
          },
        ])
        await act(async () => await result.current.handleUpdate(1, 'flatAmount', '9'))
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 4,
            total: 34,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 4,
            total: 4,
          },
          {
            units: 2,
            perUnit: 8,
            flatFee: 9,
            total: 25,
          },
          {
            units: 1,
            perUnit: 5,
            flatFee: 0,
            total: 5,
          },
        ])
      })

      it('should handle update of "toValue" correctly', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.handleUpdate(0, 'toValue', '4'))

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: 0,
            toValue: 4,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
          {
            fromValue: 5,
            toValue: null,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
        ])
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 5,
            total: 0,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 4,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
        ])

        await act(async () => await result.current.addRange())
        await act(async () => await result.current.handleUpdate(1, 'toValue', 8))
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 9,
            total: 0,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 4,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 4,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
        ])
      })

      it('should delete correcly a range', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.addRange())
        expect(result.current.tableDatas.length).toBe(3)
        await act(async () => await result.current.handleUpdate(0, 'toValue', '4'))
        await act(async () => await result.current.deleteRange(1))
        expect(result.current.tableDatas.length).toBe(2)
        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: 0,
            toValue: 4,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
          {
            fromValue: 5,
            toValue: null,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
        ])
      })
    })
  })

  describe('with groupProperties', () => {
    describe('tableDatas', () => {
      it('returns default datas if no charges defined', async () => {
        const { result } = await prepare({})

        expect(result.current.tableDatas).toStrictEqual(
          DEFAULT_GRADUATED_CHARGES.map((row) => ({ ...row, disabledDelete: true }))
        )

        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 2,
            total: 0,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
        ])
      })

      it('should add empty line with good calculation', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.addRange())

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: 0,
            toValue: 1,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
          {
            fromValue: 2,
            toValue: 3,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: false,
          },
          {
            fromValue: 4,
            toValue: null,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
        ])
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 4,
            total: 0,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 2,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
        ])
      })

      it('should handle update of row data and calculation', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.handleUpdate(0, 'flatAmount', '4'))
        await act(async () => await result.current.handleUpdate(1, 'perUnitAmount', '5'))

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: 0,
            toValue: 1,
            flatAmount: 4,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
          {
            fromValue: 2,
            toValue: null,
            flatAmount: undefined,
            perUnitAmount: 5,
            disabledDelete: true,
          },
        ])

        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 2,
            total: 9,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 4,
            total: 4,
          },
          {
            units: 1,
            perUnit: 5,
            flatFee: 0,
            total: 5,
          },
        ])
        await act(async () => await result.current.addRange())
        await act(async () => await result.current.handleUpdate(1, 'perUnitAmount', '8'))
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 4,
            total: 25,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 4,
            total: 4,
          },
          {
            units: 2,
            perUnit: 8,
            flatFee: 0,
            total: 16,
          },
          {
            units: 1,
            perUnit: 5,
            flatFee: 0,
            total: 5,
          },
        ])
        await act(async () => await result.current.handleUpdate(1, 'flatAmount', '9'))
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 4,
            total: 34,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 4,
            total: 4,
          },
          {
            units: 2,
            perUnit: 8,
            flatFee: 9,
            total: 25,
          },
          {
            units: 1,
            perUnit: 5,
            flatFee: 0,
            total: 5,
          },
        ])
      })

      it('should handle update of "toValue" correctly', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.handleUpdate(0, 'toValue', '4'))

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: 0,
            toValue: 4,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
          {
            fromValue: 5,
            toValue: null,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
        ])
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 5,
            total: 0,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 4,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
        ])

        await act(async () => await result.current.addRange())
        await act(async () => await result.current.handleUpdate(1, 'toValue', 8))
        expect(result.current.infosCaclucation).toStrictEqual([
          {
            firstUnit: 9,
            total: 0,
            perUnit: 0,
            flatFee: 0,
            units: 0,
          },
          {
            units: 4,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 4,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
          {
            units: 1,
            perUnit: 0,
            flatFee: 0,
            total: 0,
          },
        ])
      })

      it('should delete correcly a range', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.addRange())
        expect(result.current.tableDatas.length).toBe(3)
        await act(async () => await result.current.handleUpdate(0, 'toValue', '4'))
        await act(async () => await result.current.deleteRange(1))
        expect(result.current.tableDatas.length).toBe(2)
        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: 0,
            toValue: 4,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
          {
            fromValue: 5,
            toValue: null,
            flatAmount: undefined,
            perUnitAmount: undefined,
            disabledDelete: true,
          },
        ])
      })
    })
  })
})
