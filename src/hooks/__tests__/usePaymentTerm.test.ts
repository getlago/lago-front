import { renderHook } from '@testing-library/react'
import { DateTime } from 'luxon'

import {
  INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
  INHERIT_FROM_CUSTOMER_LABEL_KEY,
  paymentTermFormValuesFromTerm,
} from '~/components/paymentTerms/utils'
import {
  PAYMENT_TERM_DUE_DATE_PREVIEW_KEYS,
  PAYMENT_TERM_INHERIT,
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
        it('THEN should prepend the inherit choice', () => {
          const options = setup().getTermTypeComboboxData({
            inheritedFrom: { term: NET_30, labelKey: 'inherit_key' },
          })

          expect(options).toHaveLength(7)
          // An empty value would be indistinguishable from "nothing selected" in ComboBox.
          expect(options[0].value).toBe(PAYMENT_TERM_INHERIT)
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

    describe('GIVEN a day-of-month term', () => {
      describe.each([0, 1, 3])('WHEN its month offset is %s', (monthOffset) => {
        it('THEN should pick the copy variant with that offset', () => {
          setup().formatPaymentTerm({
            termType: PaymentTermTypeEnum.DayOfMonth,
            dayOfMonth: 15,
            monthOffset,
          })

          // "this month" / "the following month" / "N months after" are the three variants.
          expect(mockTranslate).toHaveBeenCalledWith(
            PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.DayOfMonth],
            { dayOfMonth: 15, monthOffset },
            monthOffset,
          )
        })
      })
    })

    describe('GIVEN a net term of zero days', () => {
      describe('WHEN it is formatted', () => {
        it('THEN should read as due on receipt', () => {
          setup().formatPaymentTerm({ termType: PaymentTermTypeEnum.Net, days: 0 })

          expect(mockTranslate).toHaveBeenCalledWith(
            PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.DueOnReceipt],
            {},
            0,
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

  describe('getBillingObjectPaymentTermCopy', () => {
    describe('GIVEN the object has no term and the customer has one', () => {
      it('THEN should mark the value as inherited from the customer', () => {
        const copy = setup().getBillingObjectPaymentTermCopy({
          ownTerm: null,
          customer: { paymentTerm: NET_30, billingEntity: { paymentTerm: END_OF_MONTH } },
        })

        expect(copy).toContain(INHERIT_FROM_CUSTOMER_LABEL_KEY)
        expect(copy).toContain(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.Net])
      })
    })

    describe('GIVEN neither the object nor the customer has a term', () => {
      it('THEN should mark the entity value as inherited from the billing entity', () => {
        // The hint named the customer even when the term came from the entity.
        const copy = setup().getBillingObjectPaymentTermCopy({
          ownTerm: null,
          customer: { paymentTerm: null, billingEntity: { paymentTerm: END_OF_MONTH } },
        })

        expect(copy).toContain(INHERIT_FROM_BILLING_ENTITY_LABEL_KEY)
        expect(copy).toContain(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.EndOfMonth])
      })
    })
  })

  describe('getPaymentTermFormValuesCopy', () => {
    const inheritedFrom = { term: END_OF_MONTH, labelKey: 'inherit_key' }

    describe('GIVEN the editor sits on the inherit choice', () => {
      it('THEN should read as the inherited term marked with its level', () => {
        const copy = setup().getPaymentTermFormValuesCopy(
          paymentTermFormValuesFromTerm(null, true),
          inheritedFrom,
        )

        expect(copy).toContain('inherit_key')
        expect(copy).toContain(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.EndOfMonth])
      })
    })

    describe('GIVEN the editor holds a term', () => {
      it('THEN should read as that term', () => {
        const copy = setup().getPaymentTermFormValuesCopy(
          paymentTermFormValuesFromTerm(NET_30, true),
          inheritedFrom,
        )

        expect(copy).not.toContain('inherit_key')
        expect(copy).toContain(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.Net])
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

    describe('GIVEN a term whose due date lands on the last day of a month', () => {
      describe('WHEN the reader sits in a negative-offset timezone', () => {
        it('THEN should still name that last day', () => {
          const { getDueDatePreviewCopy } = setup()

          // `endOf('month')` is 23:59:59.999. Read in a zone behind UTC it formats as the
          // 1st of the next month, so every End-of-month preview named the wrong date.
          const copy = getDueDatePreviewCopy(
            { termType: PaymentTermTypeEnum.EndOfMonth },
            DateTime.fromISO('2026-07-15', { zone: 'America/New_York' }),
          )

          expect(copy).toContain('Jul 31, 2026')
        })
      })
    })

    describe('GIVEN no issuing date is supplied', () => {
      describe('WHEN a term is previewed', () => {
        it("THEN should use the fixed example date rather than the reader's clock", () => {
          const { getDueDatePreviewCopy } = setup()

          const copy = getDueDatePreviewCopy({ termType: PaymentTermTypeEnum.DueOnReceipt })

          expect(copy).toContain('Jul 15, 2026')
        })
      })
    })

    describe('GIVEN a net term of zero days', () => {
      describe('WHEN it is previewed', () => {
        it('THEN should use the due on receipt sentence', () => {
          const copy = setup().getDueDatePreviewCopy({
            termType: PaymentTermTypeEnum.Net,
            days: 0,
          })

          expect(copy).toContain(
            PAYMENT_TERM_DUE_DATE_PREVIEW_KEYS[PaymentTermTypeEnum.DueOnReceipt],
          )
        })
      })
    })
  })
})
