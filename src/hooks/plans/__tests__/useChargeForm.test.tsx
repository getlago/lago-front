import { renderHook } from '@testing-library/react'

import { ComboboxTestMatrice, PayinAdvanceOptionDisabledTestMatrice } from './fixture'

import {
  TGetChargeModelComboboxDataProps,
  TGetIsPayInAdvanceOptionDisabledProps,
  useChargeForm,
} from '../useChargeForm'

const prepareComboboxTest = async ({
  aggregationType,
  isPremium = true,
}: TGetChargeModelComboboxDataProps) => {
  const { result } = renderHook(useChargeForm)

  return {
    getChargeModelComboboxData: result.current.getChargeModelComboboxData({
      aggregationType,
      isPremium,
    }),
  }
}

const preparePayinAdvanceOptionDisabledTest = async ({
  aggregationType,
  chargeModel,
  isPayInAdvance,
  isProrated,
  isRecurring,
}: TGetIsPayInAdvanceOptionDisabledProps) => {
  const { result } = renderHook(useChargeForm)

  return {
    getIsPayInAdvanceOptionDisabled: result.current.getIsPayInAdvanceOptionDisabled({
      aggregationType,
      chargeModel,
      isPayInAdvance,
      isProrated,
      isRecurring,
    }),
  }
}

describe('useChargeForm()', () => {
  describe('getChargeModelComboboxData()', () => {
    test.each(Array.from(ComboboxTestMatrice))(
      'should return the correct charge models for $aggregationType',
      async (testSetup) => {
        const { aggregationType, expectedChargesModels } = testSetup

        const { getChargeModelComboboxData } = await prepareComboboxTest({
          aggregationType,
          isPremium: true,
        })

        expect(getChargeModelComboboxData.map(({ value }) => value)).toEqual(expectedChargesModels)
      },
    )
  })

  describe('preparePayinAdvanceOptionDisabledTest()', () => {
    test.each(Array.from(PayinAdvanceOptionDisabledTestMatrice))(
      'should return the correct value for aggregationType: $aggregationType, chargeModel: $chargeModel, isPayInAdvance: $isPayInAdvance, isProrated: $isProrated, isRecurring: $isRecurring',
      async (testSetup) => {
        const {
          aggregationType,
          chargeModel,
          isPayInAdvance,
          isProrated,
          isRecurring,
          expectedDisabledValue,
        } = testSetup

        const { getIsPayInAdvanceOptionDisabled } = await preparePayinAdvanceOptionDisabledTest({
          aggregationType,
          chargeModel,
          isPayInAdvance,
          isProrated,
          isRecurring,
        })

        expect(getIsPayInAdvanceOptionDisabled).toEqual(expectedDisabledValue)
      },
    )
  })
})
