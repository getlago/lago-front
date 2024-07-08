import { renderHook } from '@testing-library/react'

import { ComboboxTestMatrice } from './fixture'

import { TGetChargeModelComboboxDataProps, useChargeForm } from '../useChargeForm'

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
})
