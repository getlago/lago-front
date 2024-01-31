import { act, renderHook } from '@testing-library/react'
import { useFormik } from 'formik'

import { PlanFormInput } from '~/components/plans/types'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  GraduatedRangeInput,
  PlanInterval,
} from '~/generated/graphql'

import {
  DEFAULT_GRADUATED_PERCENTAGE_CHARGES,
  useGraduatedPercentageChargeForm,
} from '../useGraduatedPercentageChargeForm'

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
              recurring: false,
              code: 'graduated',
              flatGroups:
                propertyType === 'groupProperties'
                  ? [{ id: '1', key: null, value: 'France' }]
                  : undefined,
            },
            properties: propertyType === 'properties' ? { graduatedRanges } : undefined,
            // @ts-ignore
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

    return useGraduatedPercentageChargeForm({
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

        expect(result.current.tableDatas).toStrictEqual([
          { ...DEFAULT_GRADUATED_PERCENTAGE_CHARGES[0], disabledDelete: true },
          { ...DEFAULT_GRADUATED_PERCENTAGE_CHARGES[1], disabledDelete: false },
        ])

        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
        ])
      })

      it('should add empty line with good calculation', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.addRange())

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: '0',
            toValue: '1',
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: true,
          },
          {
            fromValue: '2',
            toValue: '3',
            flatAmount: undefined,
            rate: '',
            disabledDelete: false,
          },
          {
            fromValue: '4',
            toValue: null,
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: false,
          },
        ])
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 3,
            rate: 0,
            flatAmount: 0,
          },
        ])
      })

      it('should handle update of row data and calculation', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.handleUpdate(0, 'flatAmount', '4'))

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: '0',
            toValue: '1',
            flatAmount: 4,
            rate: undefined,
            disabledDelete: true,
          },
          {
            fromValue: '2',
            toValue: null,
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: false,
          },
        ])

        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 4,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
        ])
        await act(async () => await result.current.addRange())
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 4,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 3,
            rate: 0,
            flatAmount: 0,
          },
        ])
        await act(async () => await result.current.handleUpdate(1, 'flatAmount', '9'))
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 4,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 9,
          },
          {
            units: 3,
            rate: 0,
            flatAmount: 0,
          },
        ])
      })

      it('should handle update of "toValue" correctly', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.handleUpdate(0, 'toValue', 4))

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: '0',
            toValue: '4',
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: true,
          },
          {
            fromValue: '5',
            toValue: null,
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: false,
          },
        ])
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 4,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 4,
            rate: 0,
            flatAmount: 0,
          },
        ])

        await act(async () => await result.current.addRange())
        await act(async () => await result.current.handleUpdate(1, 'toValue', 8))
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 4,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 4,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 8,
            rate: 0,
            flatAmount: 0,
          },
        ])
      })

      it('should delete correcly a range', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.addRange())
        expect(result.current.tableDatas.length).toBe(3)
        await act(async () => await result.current.handleUpdate(0, 'toValue', 4))
        await act(async () => await result.current.deleteRange(1))
        expect(result.current.tableDatas.length).toBe(2)
        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: '0',
            toValue: '4',
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: true,
          },
          {
            fromValue: '5',
            toValue: null,
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: false,
          },
        ])
      })

      // it('should delete last row and add new one correctly from default state', async () => {
      //   const { result } = await prepare({})

      //   await act(async () => await result.current.deleteRange(1))
      //   expect(result.current.tableDatas).toStrictEqual([
      //     { ...DEFAULT_GRADUATED_PERCENTAGE_CHARGES[0], toValue: null, disabledDelete: true },
      //   ])

      //   await act(async () => await result.current.addRange())

      //   expect(result.current.tableDatas).toStrictEqual([
      //     { ...DEFAULT_GRADUATED_PERCENTAGE_CHARGES[0], disabledDelete: true },
      //     { ...DEFAULT_GRADUATED_PERCENTAGE_CHARGES[1], disabledDelete: false },
      //   ])
      // })
    })
  })

  describe('with groupProperties', () => {
    describe('tableDatas', () => {
      it('returns default datas if no charges defined', async () => {
        const { result } = await prepare({})

        expect(result.current.tableDatas).toStrictEqual([
          { ...DEFAULT_GRADUATED_PERCENTAGE_CHARGES[0], disabledDelete: true },
          { ...DEFAULT_GRADUATED_PERCENTAGE_CHARGES[1], disabledDelete: false },
        ])

        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
        ])
      })

      it('should add empty line with good calculation', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.addRange())

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: '0',
            toValue: '1',
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: true,
          },
          {
            fromValue: '2',
            toValue: '3',
            flatAmount: undefined,
            rate: '',
            disabledDelete: false,
          },
          {
            fromValue: '4',
            toValue: null,
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: false,
          },
        ])
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 3,
            rate: 0,
            flatAmount: 0,
          },
        ])
      })

      it('should handle update of row data and calculation', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.handleUpdate(0, 'flatAmount', '4'))

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: '0',
            toValue: '1',
            flatAmount: 4,
            rate: undefined,
            disabledDelete: true,
          },
          {
            fromValue: '2',
            toValue: null,
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: false,
          },
        ])

        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 4,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
        ])
        await act(async () => await result.current.addRange())
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 4,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 0,
          },
          {
            flatAmount: 0,
            rate: 0,
            units: 3,
          },
        ])
        await act(async () => await result.current.handleUpdate(1, 'flatAmount', '9'))
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 1,
            rate: 0,
            flatAmount: 4,
          },
          {
            units: 1,
            rate: 0,
            flatAmount: 9,
          },
          {
            flatAmount: 0,
            rate: 0,
            units: 3,
          },
        ])
      })

      it('should handle update of "toValue" correctly', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.handleUpdate(0, 'toValue', 4))

        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: '0',
            toValue: '4',
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: true,
          },
          {
            fromValue: '5',
            toValue: null,
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: false,
          },
        ])
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 4,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 4,
            rate: 0,
            flatAmount: 0,
          },
        ])

        await act(async () => await result.current.addRange())
        await act(async () => await result.current.handleUpdate(1, 'toValue', 8))
        expect(result.current.infosCalculation).toStrictEqual([
          {
            units: 4,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 4,
            rate: 0,
            flatAmount: 0,
          },
          {
            units: 8,
            rate: 0,
            flatAmount: 0,
          },
        ])
      })

      it('should delete correcly a range', async () => {
        const { result } = await prepare({})

        await act(async () => await result.current.addRange())
        expect(result.current.tableDatas.length).toBe(3)
        await act(async () => await result.current.handleUpdate(0, 'toValue', 4))
        await act(async () => await result.current.deleteRange(1))
        expect(result.current.tableDatas.length).toBe(2)
        expect(result.current.tableDatas).toStrictEqual([
          {
            fromValue: '0',
            toValue: '4',
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: true,
          },
          {
            fromValue: '5',
            toValue: null,
            flatAmount: undefined,
            rate: undefined,
            disabledDelete: false,
          },
        ])
      })
    })
  })
})
