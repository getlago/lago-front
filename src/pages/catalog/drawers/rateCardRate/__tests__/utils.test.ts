import { Settings } from 'luxon'

import { intlFormatDateTime } from '~/core/timezone'
import {
  ChargeModelEnum,
  RateCardRateModelEnum,
  RateCardRateStatusEnum,
  TimezoneEnum,
} from '~/generated/graphql'

import {
  buildRateCodeFromEffectiveDate,
  deriveEffectiveFromBoundary,
  formatEffectiveDate,
  isEffectiveFromAppendable,
  isRateCardRateDeletable,
  isRateCardRateEditable,
  laterEffectiveFrom,
  toChargeModel,
} from '../utils'

describe('buildRateCodeFromEffectiveDate', () => {
  describe('GIVEN a picked effective date', () => {
    describe('WHEN the picker emits the UTC midnight of that day', () => {
      it('THEN derives a zero-padded rate_MM_DD_YYYY code', () => {
        expect(buildRateCodeFromEffectiveDate('2026-01-24T00:00:00.000Z')).toBe('rate_01_24_2026')
      })
    })

    describe('WHEN the ambient timezone is not UTC', () => {
      const originalDefaultZone = Settings.defaultZone

      beforeEach(() => {
        Settings.defaultZone = 'Asia/Tokyo'
      })

      // Restored here rather than after the assertion: Settings is module-global, so a
      // failing expectation would otherwise leave every later test in this file in Tokyo.
      afterEach(() => {
        Settings.defaultZone = originalDefaultZone
      })

      it('THEN still reads the day in UTC, matching the day the backend stores', () => {
        expect(buildRateCodeFromEffectiveDate('2026-01-24T00:00:00.000Z')).toBe('rate_01_24_2026')
      })
    })

    describe('WHEN there is no date yet', () => {
      it.each([
        ['an empty string', ''],
        ['an unparseable value', 'not-a-date'],
      ])('THEN returns undefined for %s', (_, value) => {
        expect(buildRateCodeFromEffectiveDate(value)).toBeUndefined()
      })
    })
  })
})

describe('formatEffectiveDate', () => {
  describe('GIVEN a stored effective date', () => {
    describe('WHEN it is rendered in an error message', () => {
      // Same rendering as the rates table and the rate overview, so the quoted boundary
      // matches the dates displayed next to it rather than reading as a US-format date.
      it('THEN formats it the way every other surface shows an effective date', () => {
        expect(formatEffectiveDate('2026-06-24T00:00:00.000Z')).toBe(
          intlFormatDateTime('2026-06-24T00:00:00.000Z', { timezone: TimezoneEnum.TzUtc }).date,
        )
      })

      it('THEN reads the day in UTC, not in the ambient zone', () => {
        expect(formatEffectiveDate('2026-06-24T00:00:00.000Z')).toBe('Jun 24, 2026')
      })
    })
  })
})

describe('laterEffectiveFrom', () => {
  const earlier = '2026-01-01T00:00:00.000Z'
  const later = '2026-06-24T00:00:00.000Z'

  describe('GIVEN two boundaries', () => {
    it.each([
      ['the second is later', earlier, later, later],
      ['the first is later', later, earlier, later],
      ['there is no first', null, later, later],
      ['there is no second', later, null, later],
      ['there is neither', null, null, null],
    ])('THEN keeps the later one WHEN %s', (_, a, b, expected) => {
      expect(laterEffectiveFrom(a, b)).toBe(expected)
    })
  })
})

describe('isEffectiveFromAppendable', () => {
  const boundary = '2026-06-24T00:00:00.000Z'

  describe('GIVEN the card already has an effective rate', () => {
    describe('WHEN the new date is compared against it', () => {
      it.each([
        ['strictly after', '2026-06-25T00:00:00.000Z', true],
        ['the very same instant', boundary, false],
        ['before', '2026-01-01T00:00:00.000Z', false],
      ])('THEN a date %s the boundary returns %s', (_, value, expected) => {
        expect(isEffectiveFromAppendable(value, boundary)).toBe(expected)
      })
    })
  })

  describe('GIVEN the card has no effective rate yet', () => {
    describe('WHEN any date is checked', () => {
      it('THEN accepts it', () => {
        expect(isEffectiveFromAppendable('2020-01-01T00:00:00.000Z', null)).toBe(true)
      })
    })
  })

  describe('GIVEN no date has been picked', () => {
    describe('WHEN it is checked', () => {
      it('THEN accepts it so the required-field error is the one that surfaces', () => {
        expect(isEffectiveFromAppendable('', boundary)).toBe(true)
      })
    })
  })
})

describe('toChargeModel', () => {
  describe('GIVEN a rate model', () => {
    describe('WHEN it is handed to a charge component', () => {
      it.each([
        [RateCardRateModelEnum.Standard, ChargeModelEnum.Standard],
        [RateCardRateModelEnum.Package, ChargeModelEnum.Package],
        [RateCardRateModelEnum.Percentage, ChargeModelEnum.Percentage],
        [RateCardRateModelEnum.Graduated, ChargeModelEnum.Graduated],
        [RateCardRateModelEnum.GraduatedPercentage, ChargeModelEnum.GraduatedPercentage],
        [RateCardRateModelEnum.Volume, ChargeModelEnum.Volume],
        [RateCardRateModelEnum.Dynamic, ChargeModelEnum.Dynamic],
        [RateCardRateModelEnum.Custom, ChargeModelEnum.Custom],
      ])('THEN %s maps to the charge model of the same name', (rateModel, expected) => {
        expect(toChargeModel(rateModel)).toBe(expected)
      })
    })
  })

  describe('GIVEN the full rate model enum', () => {
    describe('WHEN every member is mapped', () => {
      it('THEN none is left unmapped', () => {
        const mapped = Object.values(RateCardRateModelEnum).map(toChargeModel)

        expect(mapped.every(Boolean)).toBe(true)
        expect(new Set(mapped).size).toBe(Object.values(RateCardRateModelEnum).length)
      })
    })
  })
})

describe('deriveEffectiveFromBoundary', () => {
  const activeRate = { id: 'active-rate-id', effectiveFrom: '2026-06-24T00:00:00.000Z' }

  describe('GIVEN the card has an effective rate', () => {
    describe('WHEN a new rate is being appended', () => {
      it('THEN the active rate date is the boundary', () => {
        expect(deriveEffectiveFromBoundary({ activeRate })).toBe(activeRate.effectiveFrom)
      })
    })

    describe('WHEN that very rate is the one being edited', () => {
      // Comparing a rate against itself would make its own date invalid and block every save.
      it('THEN there is no boundary', () => {
        expect(deriveEffectiveFromBoundary({ activeRate }, { id: activeRate.id })).toBeNull()
      })
    })

    describe('WHEN a different rate is being edited', () => {
      it('THEN the active rate date is still the boundary', () => {
        expect(deriveEffectiveFromBoundary({ activeRate }, { id: 'other-rate-id' })).toBe(
          activeRate.effectiveFrom,
        )
      })
    })
  })

  describe('GIVEN the card has no effective rate yet', () => {
    describe('WHEN a rate is being appended', () => {
      it('THEN there is no boundary', () => {
        expect(deriveEffectiveFromBoundary({ activeRate: null })).toBeNull()
      })
    })
  })
})

describe('isRateCardRateEditable', () => {
  describe('GIVEN a terminated rate', () => {
    describe('WHEN the card is not attached to subscriptions', () => {
      it('THEN it is frozen for audit', () => {
        expect(
          isRateCardRateEditable({
            rate: { status: RateCardRateStatusEnum.Terminated },
            rateCard: { attachedToSubscriptions: false },
          }),
        ).toBe(false)
      })
    })
  })

  describe('GIVEN the card is attached to subscriptions', () => {
    describe('WHEN the rate is past pending', () => {
      it('THEN live pricing may only be appended to', () => {
        expect(
          isRateCardRateEditable({
            rate: { status: RateCardRateStatusEnum.Active },
            rateCard: { attachedToSubscriptions: true },
          }),
        ).toBe(false)
      })
    })

    describe('WHEN the rate is still pending', () => {
      it('THEN it is editable', () => {
        expect(
          isRateCardRateEditable({
            rate: { status: RateCardRateStatusEnum.Pending },
            rateCard: { attachedToSubscriptions: true },
          }),
        ).toBe(true)
      })
    })
  })

  describe('GIVEN the card is not attached to subscriptions', () => {
    describe('WHEN the rate is active', () => {
      it('THEN it is editable', () => {
        expect(
          isRateCardRateEditable({
            rate: { status: RateCardRateStatusEnum.Active },
            rateCard: { attachedToSubscriptions: false },
          }),
        ).toBe(true)
      })
    })
  })
})

describe('isRateCardRateDeletable', () => {
  describe('GIVEN a rate', () => {
    describe('WHEN its status decides whether it ever priced anything', () => {
      it.each([
        [RateCardRateStatusEnum.Pending, true],
        [RateCardRateStatusEnum.Active, false],
        [RateCardRateStatusEnum.Terminated, false],
      ])('THEN a %s rate is deletable: %s', (status, expected) => {
        expect(isRateCardRateDeletable({ status })).toBe(expected)
      })
    })
  })
})
