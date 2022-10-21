import { act, renderHook } from '@testing-library/react'
import { useFormik } from 'formik'

import { PlanFormInput } from '~/components/plans/types'
import { ChargeModelEnum, CurrencyEnum, PlanInterval, VolumeRangeInput } from '~/generated/graphql'

import { DEFAULT_VOLUME_CHARGES, useVolumeChargeForm } from '../useVolumeChargeForm'

type PrepareType = {
  chargeIndex?: number
  disabled?: boolean
  volumeRanges?: VolumeRangeInput[]
}

const prepare = async ({ chargeIndex = 0, disabled = false, volumeRanges = [] }: PrepareType) => {
  const { result } = renderHook(() =>
    useVolumeChargeForm({
      formikProps: useFormik<PlanFormInput>({
        initialValues: {
          amountCents: 1,
          amountCurrency: CurrencyEnum.Usd,
          code: 'volume',
          interval: PlanInterval.Monthly,
          name: 'volume',
          payInAdvance: false,
          charges: [
            {
              chargeModel: ChargeModelEnum.Volume,
              billableMetric: {
                id: '1',
                name: 'volume',
                code: 'volume',
              },
              properties: { volumeRanges },
            },
          ],
        },
        onSubmit: () => {},
      }),
      chargeIndex,
      disabled,
    })
  )

  // Needed to fix warning about useEffect hook being re-rendering the renderHook test component
  // It makes the result being a Promise
  await act(() => Promise.resolve())

  return { result }
}

describe('useVolumeChargeForm()', () => {
  describe('tableDatas', () => {
    it('returns default datas if no charges defined', async () => {
      const { result } = await prepare({})

      expect(result.current.tableDatas).toStrictEqual(
        DEFAULT_VOLUME_CHARGES.map((row) => ({ ...row, disabledDelete: true }))
      )
    })

    it('returns in tableDatas the given datas', async () => {
      const volumeRanges = [
        {
          fromValue: 0,
          toValue: 1,
          flatAmount: '1',
          perUnitAmount: '2',
        },
        {
          fromValue: 1,
          toValue: 2,
          flatAmount: '1',
          perUnitAmount: '1',
        },
        {
          fromValue: 2,
          toValue: null,
          flatAmount: '1',
          perUnitAmount: '1',
        },
      ]
      const { result } = await prepare({
        volumeRanges,
      })

      expect(result.current.tableDatas).toStrictEqual(
        volumeRanges.map((row, i) => ({
          ...row,
          disabledDelete: [0, volumeRanges.length - 1].includes(i),
        }))
      )
    })

    it('should all be disabled if disabled props is true', async () => {
      const volumeRanges = [
        {
          fromValue: 0,
          toValue: 1,
          flatAmount: '1',
          perUnitAmount: '2',
        },
        {
          fromValue: 1,
          toValue: 2,
          flatAmount: '1',
          perUnitAmount: '1',
        },
        {
          fromValue: 2,
          toValue: null,
          flatAmount: '1',
          perUnitAmount: '1',
        },
      ]
      const { result } = await prepare({
        volumeRanges,
        disabled: true,
      })

      expect(result.current.tableDatas).toStrictEqual(
        volumeRanges.map((row) => ({
          ...row,
          disabledDelete: true,
        }))
      )
    })
  })
  describe('infosCalculation', () => {
    it('returns expected results with given props', async () => {
      const volumeRanges = [
        {
          fromValue: 0,
          toValue: 100,
          flatAmount: '1',
          perUnitAmount: '1',
        },
        {
          fromValue: 101,
          toValue: 500,
          flatAmount: '1',
          perUnitAmount: '0.9',
        },
        {
          fromValue: 501,
          toValue: null,
          flatAmount: '1',
          perUnitAmount: '0.2',
        },
      ]
      const { result } = await prepare({
        volumeRanges,
      })

      expect(result.current.infosCalculation).toStrictEqual({
        lastRowFirstUnit: 501,
        lastRowFlatFee: 1,
        lastRowPerUnit: 0.2,
        value: 101.2,
      })
    })
  })

  describe('addRange()', () => {
    it('should add one row in volumeRanges and update infosCalculation', async () => {
      const volumeRanges = [
        {
          toValue: 100,
          fromValue: 0,
          flatAmount: '1',
          perUnitAmount: '1',
        },
        {
          fromValue: 101,
          toValue: 500,
          flatAmount: '1',
          perUnitAmount: '0.9',
        },
        {
          fromValue: 501,
          toValue: null,
          flatAmount: '1',
          perUnitAmount: '0.3',
        },
      ]
      const { result } = await prepare({
        volumeRanges,
      })

      await act(async () => await result.current.addRange())

      expect(result.current.infosCalculation).toStrictEqual({
        lastRowFirstUnit: 503,
        lastRowFlatFee: 1,
        lastRowPerUnit: 0.3,
        value: 151.9,
      })

      expect(result.current.tableDatas.length).toBe(4)
      expect(result.current.tableDatas).toStrictEqual([
        { ...volumeRanges[0], disabledDelete: true },
        { ...volumeRanges[1], disabledDelete: false },
        {
          toValue: 502,
          fromValue: 501,
          flatAmount: undefined,
          perUnitAmount: undefined,
          disabledDelete: false,
        },
        {
          toValue: null,
          fromValue: 503,
          flatAmount: volumeRanges[2].flatAmount,
          perUnitAmount: volumeRanges[2].perUnitAmount,
          disabledDelete: true,
        },
      ])
    })
  })

  describe('handleUpdate()', () => {
    it('should correctly udpate data', async () => {
      const volumeRanges = [
        {
          fromValue: 0,
          toValue: 100,
          flatAmount: '1',
          perUnitAmount: '1',
        },
        {
          fromValue: 101,
          toValue: 500,
          flatAmount: '1',
          perUnitAmount: '0.9',
        },
        {
          fromValue: 501,
          toValue: null,
          flatAmount: '1',
          perUnitAmount: '0.2',
        },
      ]
      const { result } = await prepare({
        volumeRanges,
      })

      await act(async () => await result.current.handleUpdate(1, 'toValue', ''))
      expect(result.current.tableDatas).toStrictEqual([
        { ...volumeRanges[0], disabledDelete: true },
        { ...{ ...volumeRanges[1], toValue: 0 }, disabledDelete: false },
        { ...{ ...volumeRanges[2], fromValue: 1, toValue: null }, disabledDelete: true },
      ])

      await act(async () => await result.current.handleUpdate(1, 'toValue', 30))
      expect(result.current.tableDatas).toStrictEqual([
        { ...volumeRanges[0], disabledDelete: true },
        { ...{ ...volumeRanges[1], toValue: 30 }, disabledDelete: false },
        { ...{ ...volumeRanges[2], fromValue: 31, toValue: null }, disabledDelete: true },
      ])
      await act(async () => await result.current.handleUpdate(1, 'toValue', 500))

      await act(async () => await result.current.handleUpdate(1, 'flatAmount', '10'))
      expect(result.current.tableDatas).toStrictEqual([
        { ...volumeRanges[0], disabledDelete: true },
        { ...{ ...volumeRanges[1], flatAmount: 10 }, disabledDelete: false },
        { ...volumeRanges[2], disabledDelete: true },
      ])
      await act(async () => await result.current.handleUpdate(1, 'flatAmount', '1'))

      await act(async () => await result.current.handleUpdate(1, 'fromValue', 5))
      expect(result.current.tableDatas).toStrictEqual([
        { ...volumeRanges[0], disabledDelete: true },
        { ...{ ...volumeRanges[1], flatAmount: 1, fromValue: 5 }, disabledDelete: false },
        { ...volumeRanges[2], disabledDelete: true },
      ])
    })
  })

  describe('deleteRange()', () => {
    it('should correctly udpate data', async () => {
      const volumeRanges = [
        {
          fromValue: 0,
          toValue: 100,
          flatAmount: '1',
          perUnitAmount: '1',
        },
        {
          fromValue: 101,
          toValue: 500,
          flatAmount: '1',
          perUnitAmount: '0.9',
        },
        {
          fromValue: 501,
          toValue: null,
          flatAmount: '1',
          perUnitAmount: '0.2',
        },
      ]
      const { result } = await prepare({
        volumeRanges,
      })

      expect(result.current.tableDatas.length).toBe(3)

      await act(async () => await result.current.deleteRange(1))

      expect(result.current.tableDatas.length).toBe(2)
      expect(result.current.tableDatas).toStrictEqual([
        { ...volumeRanges[0], disabledDelete: true },
        { ...{ ...volumeRanges[2], fromValue: 101 }, disabledDelete: true },
      ])
    })
  })
})
