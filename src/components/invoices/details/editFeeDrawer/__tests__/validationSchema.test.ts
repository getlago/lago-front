import { AdjustedFeeTypeEnum } from '~/generated/graphql'

import {
  buildEditFeeDefaultValues,
  EDIT_FEE_DEFAULT_VALUES,
  editFeeValidationSchema,
} from '../validationSchema'

const erroredFields = (values: Partial<typeof EDIT_FEE_DEFAULT_VALUES>): string[] => {
  const result = editFeeValidationSchema.safeParse({ ...EDIT_FEE_DEFAULT_VALUES, ...values })

  if (result.success) return []

  return result.error.issues.map((issue) => issue.path.join('.')).sort()
}

describe('editFeeValidationSchema', () => {
  describe('GIVEN no adjustment type has been picked', () => {
    describe('WHEN the form is validated', () => {
      it('THEN should reject on the adjustment type alone', () => {
        expect(erroredFields({ units: '', unitPreciseAmount: '' })).toEqual(['adjustmentType'])
      })
    })
  })

  describe('GIVEN the units adjustment type is picked', () => {
    describe('WHEN units are missing', () => {
      it('THEN should reject on units', () => {
        expect(
          erroredFields({ adjustmentType: AdjustedFeeTypeEnum.AdjustedUnits, units: '' }),
        ).toEqual(['units'])
      })
    })

    describe('WHEN units are filled', () => {
      // The yup `.test` this replaces let `0` through (`Number(0) === 0`), so an explicit
      // zero-ing of a fee must stay valid.
      it.each([
        ['a positive amount', '5'],
        ['zero', '0'],
        ['a decimal', '0.5'],
      ])('THEN should accept %s without asking for a unit amount', (_, units) => {
        expect(erroredFields({ adjustmentType: AdjustedFeeTypeEnum.AdjustedUnits, units })).toEqual(
          [],
        )
      })
    })
  })

  describe('GIVEN the amount adjustment type is picked', () => {
    describe('WHEN both units and unit amount are missing', () => {
      it('THEN should reject on both', () => {
        expect(
          erroredFields({
            adjustmentType: AdjustedFeeTypeEnum.AdjustedAmount,
            units: '',
            unitPreciseAmount: '',
          }),
        ).toEqual(['unitPreciseAmount', 'units'])
      })
    })

    describe('WHEN only the unit amount is missing', () => {
      it('THEN should reject on the unit amount', () => {
        expect(
          erroredFields({
            adjustmentType: AdjustedFeeTypeEnum.AdjustedAmount,
            units: '2',
            unitPreciseAmount: '',
          }),
        ).toEqual(['unitPreciseAmount'])
      })
    })

    describe('WHEN both are filled', () => {
      it('THEN should accept the form', () => {
        expect(
          erroredFields({
            adjustmentType: AdjustedFeeTypeEnum.AdjustedAmount,
            units: '2',
            unitPreciseAmount: '12.3456',
          }),
        ).toEqual([])
      })
    })
  })

  describe('GIVEN the charge identifiers are empty', () => {
    describe('WHEN the form is otherwise valid', () => {
      it('THEN should not require any of them', () => {
        expect(
          erroredFields({
            adjustmentType: AdjustedFeeTypeEnum.AdjustedUnits,
            units: '1',
            chargeId: '',
            fixedChargeId: '',
            chargeFilterId: '',
            invoiceDisplayName: '',
          }),
        ).toEqual([])
      })
    })
  })
})

describe('buildEditFeeDefaultValues', () => {
  const fee = {
    invoiceDisplayName: 'Custom name',
    units: 12,
    preciseUnitAmount: 3.5,
  } as Parameters<typeof buildEditFeeDefaultValues>[0]['fee']

  describe('GIVEN the drawer opens outside the regenerate flow', () => {
    describe('WHEN a fee is passed', () => {
      it('THEN should seed the display name but leave the adjustment inputs empty', () => {
        expect(buildEditFeeDefaultValues({ fee, isRegenerateMode: false })).toEqual({
          ...EDIT_FEE_DEFAULT_VALUES,
          invoiceDisplayName: 'Custom name',
        })
      })
    })
  })

  describe('GIVEN the drawer opens in the regenerate flow', () => {
    describe('WHEN a fee is passed', () => {
      it('THEN should seed units and unit amount as strings so the inputs keep the data', () => {
        expect(buildEditFeeDefaultValues({ fee, isRegenerateMode: true })).toEqual({
          ...EDIT_FEE_DEFAULT_VALUES,
          invoiceDisplayName: 'Custom name',
          units: '12',
          unitPreciseAmount: '3.5',
        })
      })
    })

    describe('WHEN the fee carries zero units', () => {
      it('THEN should seed "0" rather than an empty input', () => {
        expect(
          buildEditFeeDefaultValues({
            fee: { ...fee, units: 0 } as typeof fee,
            isRegenerateMode: true,
          }).units,
        ).toBe('0')
      })
    })

    describe('WHEN no fee is passed', () => {
      it('THEN should fall back to the empty defaults', () => {
        expect(buildEditFeeDefaultValues({ fee: undefined, isRegenerateMode: true })).toEqual(
          EDIT_FEE_DEFAULT_VALUES,
        )
      })
    })
  })
})
