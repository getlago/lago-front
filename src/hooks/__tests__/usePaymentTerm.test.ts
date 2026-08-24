import { renderHook } from '@testing-library/react'
import { DateTime } from 'luxon'

import {
  PAYMENT_TERM_TYPE_LABEL_KEYS,
  PAYMENT_TERM_TYPES,
  PAYMENT_TERM_VALUE_KEYS,
} from '~/core/constants/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'
import { usePaymentTerm } from '~/hooks/usePaymentTerm'

const mockTranslate = jest.fn(
  (key: string, data?: Record<string, unknown>) =>
    `${key}${data && Object.keys(data).length ? `:${JSON.stringify(data)}` : ''}`,
)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: mockTranslate }),
}))

const setup = () => renderHook(() => usePaymentTerm()).result.current

const NET_30 = { termType: PaymentTermTypeEnum.Net, days: 30 }
const END_OF_MONTH = { termType: PaymentTermTypeEnum.EndOfMonth }

describe('usePaymentTerm', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getTermTypeComboboxData', () => {
    describe('GIVEN a level with no parent to inherit from', () => {
      describe('WHEN the options are built', () => {
        it('THEN should list the six term types in the spec order and nothing else', () => {
          const options = setup().getTermTypeComboboxData()

          expect(options).toHaveLength(6)
          expect(options.map((option) => option.value)).toEqual([...PAYMENT_TERM_TYPES])
        })

        it('THEN should give every option a label and a description', () => {
          const options = setup().getTermTypeComboboxData()

          options.forEach((option, index) => {
            expect(option.label).toBe(
              mockTranslate(PAYMENT_TERM_TYPE_LABEL_KEYS[PAYMENT_TERM_TYPES[index]]),
            )
            expect(option.description).toBeTruthy()
          })
        })
      })
    })

    describe('GIVEN a level that can inherit from its parent', () => {
      describe('WHEN the options are built', () => {
        it('THEN should prepend an empty-valued inherit choice', () => {
          const options = setup().getTermTypeComboboxData({
            inheritedFrom: { term: NET_30, labelKey: 'inherit_key' },
          })

          expect(options).toHaveLength(7)
          expect(options[0].value).toBe('')
          expect(options.slice(1).map((option) => option.value)).toEqual([...PAYMENT_TERM_TYPES])
        })

        it('THEN should label the inherit choice with the value it would inherit', () => {
          const options = setup().getTermTypeComboboxData({
            inheritedFrom: { term: NET_30, labelKey: 'inherit_key' },
          })

          expect(mockTranslate).toHaveBeenCalledWith('inherit_key', {
            value: expect.stringContaining(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.Net]),
          })
          expect(options[0].label).toContain('inherit_key')
        })
      })
    })
  })

  describe('formatPaymentTerm', () => {
    describe('GIVEN a term carrying a day count', () => {
      describe('WHEN it is formatted', () => {
        it('THEN should interpolate the count and drive the plural with it', () => {
          setup().formatPaymentTerm(NET_30)

          expect(mockTranslate).toHaveBeenCalledWith(
            PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.Net],
            { days: 30 },
            30,
          )
        })
      })
    })

    describe('GIVEN a day-of-month term with no explicit month offset', () => {
      describe('WHEN it is formatted', () => {
        it('THEN should fall back to the API default of the following month', () => {
          setup().formatPaymentTerm({
            termType: PaymentTermTypeEnum.DayOfMonth,
            dayOfMonth: 15,
          })

          expect(mockTranslate).toHaveBeenCalledWith(
            PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.DayOfMonth],
            { dayOfMonth: 15, monthOffset: 1 },
            1,
          )
        })
      })
    })
  })

  describe('getPaymentTermCopy', () => {
    describe('GIVEN the level carries its own term', () => {
      describe('WHEN the copy is built', () => {
        it('THEN should show it unmarked, even when the parent has one too', () => {
          const copy = setup().getPaymentTermCopy({ ownTerm: NET_30, parentTerm: END_OF_MONTH })

          expect(copy).toContain(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.Net])
          expect(copy).not.toContain('text_1728374331992d2alok9y3kr')
        })
      })
    })

    describe('GIVEN the level carries no term', () => {
      describe('WHEN the parent has one', () => {
        it('THEN should show the parent value marked as inherited', () => {
          const copy = setup().getPaymentTermCopy({ ownTerm: null, parentTerm: END_OF_MONTH })

          expect(copy).toContain('text_1728374331992d2alok9y3kr')
          expect(copy).toContain(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.EndOfMonth])
        })
      })

      describe('WHEN nothing is set at any level', () => {
        it('THEN should fall back to due on receipt, marked as inherited', () => {
          const copy = setup().getPaymentTermCopy({ ownTerm: null, parentTerm: null })

          expect(copy).toContain('text_1728374331992d2alok9y3kr')
          expect(copy).toContain(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.DueOnReceipt])
        })
      })
    })
  })

  describe('getDueDatePreviewCopy', () => {
    describe('GIVEN the two end-of-month conventions share a day count', () => {
      describe('WHEN each is previewed from the same issuing date', () => {
        it('THEN should produce the different dates that tell them apart', () => {
          const issuingDate = DateTime.fromISO('2026-07-15')
          const { getDueDatePreviewCopy } = setup()

          const us = getDueDatePreviewCopy(
            { termType: PaymentTermTypeEnum.NetEndOfMonth, days: 30 },
            issuingDate,
          )
          const eu = getDueDatePreviewCopy(
            { termType: PaymentTermTypeEnum.DaysEndOfMonth, days: 30 },
            issuingDate,
          )

          expect(us).not.toEqual(eu)
        })
      })
    })
  })
})
