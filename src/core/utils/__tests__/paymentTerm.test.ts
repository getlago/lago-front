import { DateTime } from 'luxon'

import {
  buildPaymentTermInput,
  paymentTermDueDate,
  ResolvablePaymentTerm,
  resolvePaymentTerm,
} from '~/core/utils/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'

const dueDate = (issuingDate: string, term: ResolvablePaymentTerm): string =>
  paymentTermDueDate(DateTime.fromISO(issuingDate), term).toISODate() as string

describe('paymentTerm', () => {
  describe('paymentTermDueDate', () => {
    // The reference table from the spec: every type against the same issuing date.
    it.each`
      termType                              | days  | expected
      ${PaymentTermTypeEnum.DueOnReceipt}   | ${0}  | ${'2026-07-15'}
      ${PaymentTermTypeEnum.Net}            | ${30} | ${'2026-08-14'}
      ${PaymentTermTypeEnum.EndOfMonth}     | ${0}  | ${'2026-07-31'}
      ${PaymentTermTypeEnum.NetEndOfMonth}  | ${30} | ${'2026-08-30'}
      ${PaymentTermTypeEnum.DaysEndOfMonth} | ${30} | ${'2026-08-31'}
    `('resolves $termType to $expected', ({ termType, days, expected }) => {
      expect(dueDate('2026-07-15', { termType, days })).toBe(expected)
    })

    it('resolves day of month with the default offset to the following month', () => {
      expect(
        dueDate('2026-07-15', {
          termType: PaymentTermTypeEnum.DayOfMonth,
          dayOfMonth: 15,
          monthOffset: 1,
        }),
      ).toBe('2026-08-15')
    })

    it('gives the two end-of-month conventions different dates for the same days', () => {
      const usConvention = dueDate('2026-07-15', {
        termType: PaymentTermTypeEnum.NetEndOfMonth,
        days: 30,
      })
      const euConvention = dueDate('2026-07-15', {
        termType: PaymentTermTypeEnum.DaysEndOfMonth,
        days: 30,
      })

      expect(usConvention).not.toBe(euConvention)
    })

    it('accepts a zero day count', () => {
      expect(dueDate('2026-07-15', { termType: PaymentTermTypeEnum.Net, days: 0 })).toBe(
        '2026-07-15',
      )
      expect(dueDate('2026-07-15', { termType: PaymentTermTypeEnum.NetEndOfMonth, days: 0 })).toBe(
        '2026-07-31',
      )
      expect(dueDate('2026-07-15', { termType: PaymentTermTypeEnum.DaysEndOfMonth, days: 0 })).toBe(
        '2026-07-31',
      )
    })

    describe('day of month clamping', () => {
      it.each`
        issuingDate     | dayOfMonth | monthOffset | expected        | because
        ${'2026-08-15'} | ${31}      | ${1}        | ${'2026-09-30'} | ${'September has 30 days'}
        ${'2026-01-15'} | ${31}      | ${1}        | ${'2026-02-28'} | ${'February 2026 has 28 days'}
        ${'2028-01-15'} | ${31}      | ${1}        | ${'2028-02-29'} | ${'February 2028 is a leap year'}
        ${'2026-07-15'} | ${15}      | ${1}        | ${'2026-08-15'} | ${'a mid-month day never clamps'}
      `(
        'clamps to $expected because $because',
        ({ issuingDate, dayOfMonth, monthOffset, expected }) => {
          expect(
            dueDate(issuingDate, {
              termType: PaymentTermTypeEnum.DayOfMonth,
              dayOfMonth,
              monthOffset,
            }),
          ).toBe(expected)
        },
      )
    })

    describe('day of month roll forward', () => {
      it('rolls to next month when the resolved day is already past', () => {
        expect(
          dueDate('2026-07-15', {
            termType: PaymentTermTypeEnum.DayOfMonth,
            dayOfMonth: 10,
            monthOffset: 0,
          }),
        ).toBe('2026-08-10')
      })

      it('does not roll when the resolved day is the issuing date itself', () => {
        expect(
          dueDate('2026-07-15', {
            termType: PaymentTermTypeEnum.DayOfMonth,
            dayOfMonth: 15,
            monthOffset: 0,
          }),
        ).toBe('2026-07-15')
      })

      it('never rolls when the offset is at least one month', () => {
        expect(
          dueDate('2026-07-15', {
            termType: PaymentTermTypeEnum.DayOfMonth,
            dayOfMonth: 10,
            monthOffset: 1,
          }),
        ).toBe('2026-08-10')
      })

      it('re-clamps after rolling onto a shorter month', () => {
        // Jan 31 issuing, day 30, offset 0 → Jan 30 is past → roll to February → clamp to 28.
        expect(
          dueDate('2026-01-31', {
            termType: PaymentTermTypeEnum.DayOfMonth,
            dayOfMonth: 30,
            monthOffset: 0,
          }),
        ).toBe('2026-02-28')
      })
    })

    it('defaults a missing month offset to the following month', () => {
      expect(
        dueDate('2026-07-15', { termType: PaymentTermTypeEnum.DayOfMonth, dayOfMonth: 15 }),
      ).toBe('2026-08-15')
    })

    it('allows a past due date on a backdated net invoice', () => {
      expect(dueDate('2026-01-05', { termType: PaymentTermTypeEnum.Net, days: 30 })).toBe(
        '2026-02-04',
      )
    })
  })

  describe('buildPaymentTermInput', () => {
    // The API rejects any field that does not belong to the chosen type, so the payload
    // must carry exactly its own fields and nothing else.
    it('sends no numeric field for the types that carry none', () => {
      expect(
        buildPaymentTermInput({
          termType: PaymentTermTypeEnum.DueOnReceipt,
          days: 30,
          dayOfMonth: 12,
          monthOffset: 2,
        }),
      ).toEqual({ termType: PaymentTermTypeEnum.DueOnReceipt })

      expect(buildPaymentTermInput({ termType: PaymentTermTypeEnum.EndOfMonth, days: 30 })).toEqual(
        { termType: PaymentTermTypeEnum.EndOfMonth },
      )
    })

    it.each([
      PaymentTermTypeEnum.Net,
      PaymentTermTypeEnum.NetEndOfMonth,
      PaymentTermTypeEnum.DaysEndOfMonth,
    ])('sends only days for %s', (termType) => {
      expect(buildPaymentTermInput({ termType, days: 30, dayOfMonth: 12, monthOffset: 2 })).toEqual(
        {
          termType,
          days: 30,
        },
      )
    })

    it('sends only the day of month fields for a day of month term', () => {
      expect(
        buildPaymentTermInput({
          termType: PaymentTermTypeEnum.DayOfMonth,
          days: 30,
          dayOfMonth: 12,
          monthOffset: 2,
        }),
      ).toEqual({ termType: PaymentTermTypeEnum.DayOfMonth, dayOfMonth: 12, monthOffset: 2 })
    })

    it('fills the default month offset when it is absent', () => {
      expect(
        buildPaymentTermInput({ termType: PaymentTermTypeEnum.DayOfMonth, dayOfMonth: 12 }),
      ).toEqual({ termType: PaymentTermTypeEnum.DayOfMonth, dayOfMonth: 12, monthOffset: 1 })
    })

    it('coerces a days value entered as text', () => {
      expect(
        buildPaymentTermInput({
          termType: PaymentTermTypeEnum.Net,
          days: '45' as unknown as number,
        }),
      ).toEqual({ termType: PaymentTermTypeEnum.Net, days: 45 })
    })
  })

  describe('resolvePaymentTerm', () => {
    const net30 = { termType: PaymentTermTypeEnum.Net, days: 30 }
    const endOfMonth = { termType: PaymentTermTypeEnum.EndOfMonth }

    it('prefers its own term over the parent one', () => {
      expect(resolvePaymentTerm({ ownTerm: net30, parentTerm: endOfMonth })).toEqual({
        term: net30,
        isInherited: false,
      })
    })

    it('falls back to the parent term and reports it as inherited', () => {
      expect(resolvePaymentTerm({ ownTerm: null, parentTerm: endOfMonth })).toEqual({
        term: endOfMonth,
        isInherited: true,
      })
    })

    it('falls back to due on receipt when nothing is set anywhere', () => {
      expect(resolvePaymentTerm({ ownTerm: null, parentTerm: null })).toEqual({
        term: { termType: PaymentTermTypeEnum.DueOnReceipt },
        isInherited: true,
      })
    })
  })
})
