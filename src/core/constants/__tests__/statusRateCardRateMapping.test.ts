import { StatusType } from '~/components/designSystem/Status'
import { RateCardRateStatusEnum } from '~/generated/graphql'

import { rateCardRateStatusMapping } from '../statusRateCardRateMapping'

describe('rateCardRateStatusMapping', () => {
  describe('GIVEN a rate status', () => {
    describe('WHEN it is mapped to a badge', () => {
      it.each([
        [RateCardRateStatusEnum.Active, StatusType.success, 'active'],
        [RateCardRateStatusEnum.Pending, StatusType.default, 'pending'],
        // A superseded rate is a normal end of life, not an incident: disabled, not danger.
        [RateCardRateStatusEnum.Terminated, StatusType.disabled, 'terminated'],
      ])('THEN maps %s to the %s badge', (status, type, label) => {
        expect(rateCardRateStatusMapping(status)).toEqual({ type, label })
      })
    })
  })

  describe('GIVEN an unknown status reaches the mapping', () => {
    describe('WHEN it is mapped to a badge', () => {
      it('THEN falls back to the pending badge', () => {
        expect(rateCardRateStatusMapping('something_new' as RateCardRateStatusEnum)).toEqual({
          type: StatusType.default,
          label: 'pending',
        })
      })
    })
  })
})
