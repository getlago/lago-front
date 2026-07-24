import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { CurrencyEnum, EditPlanFragment } from '~/generated/graphql'

import { buildDefaultValues } from '../usePlanForm'

describe('buildDefaultValues', () => {
  describe('GIVEN a plan with metadata', () => {
    describe('WHEN building the default form values', () => {
      it('THEN should hydrate the metadata pairs and coerce null values to empty strings', () => {
        const defaults = buildDefaultValues(
          {
            metadata: [
              { key: 'product_group', value: 'Premium Suite' },
              { key: 'display_order', value: null },
            ],
          } as unknown as EditPlanFragment,
          FORM_TYPE_ENUM.creation,
          CurrencyEnum.Usd,
          false,
        )

        expect(defaults.metadata).toEqual([
          { key: 'product_group', value: 'Premium Suite' },
          { key: 'display_order', value: '' },
        ])
      })
    })
  })

  describe('GIVEN a plan without metadata', () => {
    describe('WHEN building the default form values', () => {
      it('THEN should default metadata to an empty array', () => {
        const defaults = buildDefaultValues(
          {} as unknown as EditPlanFragment,
          FORM_TYPE_ENUM.creation,
          CurrencyEnum.Usd,
          false,
        )

        expect(defaults.metadata).toEqual([])
      })

      it('THEN should default metadata to an empty array when the plan is undefined', () => {
        const defaults = buildDefaultValues(
          undefined,
          FORM_TYPE_ENUM.creation,
          CurrencyEnum.Usd,
          false,
        )

        expect(defaults.metadata).toEqual([])
      })
    })
  })
})
