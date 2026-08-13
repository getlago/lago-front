import { ApolloError } from '@apollo/client'

import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  BILLING_ITEM_CODE_KEYS,
  BILLING_ITEM_FIELD_ERROR_KEYS,
  getQuoteMutationErrors,
  ORDER_FORM_ERROR_KEYS,
  QUOTE_MUTATION_SILENT_ERROR_CODES,
  TOP_LEVEL_ERROR_KEYS,
} from '../quoteMutationErrors'

const GENERIC_ERROR_KEY = 'text_622f7a3dc32ce100c46a5154'

// Echoes the key back (interpolating `{{var}}`) so assertions read on keys, not on copy
// that translators will rewrite.
const translate: TranslateFunc = (key, data) => {
  if (!data) return key

  const interpolated = Object.entries(data)
    .map(([name, value]) => `${name}=${value}`)
    .join(',')

  return `${key}(${interpolated})`
}

const makeError = (
  code: string,
  details?: Record<string, string[]>,
): ApolloError['graphQLErrors'] =>
  [
    {
      message: 'error',
      extensions: details ? { code, details } : { code },
    },
  ] as never

describe('getQuoteMutationErrors', () => {
  describe('codes carrying no details', () => {
    it('returns the permission message on forbidden', () => {
      expect(getQuoteMutationErrors(makeError('forbidden'), translate)).toEqual([
        { message: 'text_17865407897429mqm1fco12j' },
      ])
    })

    it('returns the premium message on feature_unavailable', () => {
      expect(getQuoteMutationErrors(makeError('feature_unavailable'), translate)).toEqual([
        { message: 'text_1786540789742kokuwxcy86s' },
      ])
    })

    it('falls back to the generic message when a handled code carries no details', () => {
      expect(getQuoteMutationErrors(makeError('unprocessable_entity'), translate)).toEqual([
        { message: GENERIC_ERROR_KEY },
      ])
    })

    it('returns nothing on a code the global error link still toasts itself', () => {
      expect(getQuoteMutationErrors(makeError('internal_error'), translate)).toEqual([])
      expect(
        getQuoteMutationErrors(makeError('internal_error', { status: ['foo'] }), translate),
      ).toEqual([])
    })

    it('falls back to the generic message when there is no error at all', () => {
      expect(getQuoteMutationErrors(undefined, translate)).toEqual([{ message: GENERIC_ERROR_KEY }])
      expect(getQuoteMutationErrors([], translate)).toEqual([{ message: GENERIC_ERROR_KEY }])
    })
  })

  describe('quote-version level details', () => {
    it.each([
      ['status', 'not_approvable', 'text_1786540789742thnfvmjlq8a'],
      ['status', 'not_voidable', 'text_1786540789742nso5acvqa28'],
      ['currency', 'value_is_mandatory', 'text_17865407897425abgh9dnl45'],
      ['currency', 'invalid_currency', 'text_1786540789742i50p3wlht3g'],
      ['quoteVersion', 'not_found', 'text_178654078974209u9bigc6ta'],
      ['quoteVersion', 'not_approved', 'text_1786540789742edgippmh4fh'],
      ['quoteVersionId', 'value_already_exist', 'text_1786540789742km6ifr1uf63'],
      ['voidReason', 'invalid', 'text_1786540789742xzmnw0kbnw2'],
      ['startDate', 'value_is_mandatory', 'text_1786540789742o1548c5v0cr'],
      ['startDate', 'invalid_date_range', 'text_1786540789742hb3p2cjocck'],
    ])('maps %s.%s to its own message', (field, code, expectedKey) => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', { [field]: [code] }),
        translate,
      )

      expect(errors).toEqual([{ message: expectedKey, field: undefined }])
    })

    it('flags expiresAt.invalid_date as a form field error', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', { expiresAt: ['invalid_date'] }),
        translate,
      )

      expect(errors).toEqual([
        {
          message: 'text_1786540789742b4ym3200cp6',
          field: 'expiresAt',
          messageKey: 'text_1786540789742b4ym3200cp6',
        },
      ])
    })

    it('maps the not_found payload the API sends for an unknown version', () => {
      const errors = getQuoteMutationErrors(
        makeError('not_found', { quoteVersion: ['not_found'] }),
        translate,
      )

      expect(errors).toEqual([{ message: 'text_178654078974209u9bigc6ta', field: undefined }])
    })

    it('falls back to the generic message on an unknown detail key', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', { somethingElse: ['who_knows'] }),
        translate,
      )

      expect(errors).toEqual([{ message: GENERIC_ERROR_KEY }])
    })
  })

  describe('billing item details', () => {
    it('prefixes the message with the 1-based item position', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', { 'billingItems.plans.0.id': ['plan_not_found'] }),
        translate,
      )

      expect(errors).toEqual([
        {
          message:
            'text_1786540789743pr2fbjucq45(prefix=text_1786540789742q2ym1u6mrwh(index=1),detail=text_1786540789743r5ldiuhgw6f)',
        },
      ])
    })

    it('prefers the field-specific message over the bare code message', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', {
          'billingItems.coupons.1.payload.amountCents': ['value_is_mandatory'],
        }),
        translate,
      )

      expect(errors[0].message).toContain('text_1786540789742ofilmd17tfv(index=2)')
      expect(errors[0].message).toContain('text_17865407897439beomgnzd95')
    })

    it('resolves a field nested under the overrides wrapper', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', {
          'billingItems.addOns.0.overrides.unitAmountCents': ['invalid_value'],
        }),
        translate,
      )

      expect(errors[0].message).toContain('text_1786540789742gcenndpbfyl(index=1)')
      expect(errors[0].message).toContain('text_17865407897432o3ig68pgdf')
    })

    it('names the nested recurring rule position', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', {
          'billingItems.walletCredits.0.payload.recurringTransactionRules.1.interval': [
            'value_is_mandatory',
          ],
        }),
        translate,
      )

      expect(errors[0].message).toContain('text_1786540789743koa76e679es(index=1,ruleIndex=2)')
      expect(errors[0].message).toContain('text_1786540789743w37crn5u26h')
    })

    it('falls back to the bare code message when the field has no bespoke copy', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', {
          'billingItems.plans.2.id': ['currencies_does_not_match'],
        }),
        translate,
      )

      expect(errors[0].message).toContain('text_1786540789742q2ym1u6mrwh(index=3)')
      expect(errors[0].message).toContain('text_1786540789743zvj7xtx1x6j')
    })

    it('falls back to the generic message on a coarse key with no item position', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', { 'billingItems.plans': ['invalid_count'] }),
        translate,
      )

      expect(errors).toEqual([{ message: GENERIC_ERROR_KEY }])
    })

    it('falls back to the generic message on an unknown entity', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', { 'billingItems.unicorns.0.id': ['is_invalid'] }),
        translate,
      )

      expect(errors).toEqual([{ message: GENERIC_ERROR_KEY }])
    })
  })

  describe('multi-key validation failures', () => {
    it('returns one message per detail key, capped at three', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', {
          'billingItems.plans.0.id': ['plan_not_found'],
          'billingItems.plans.1.id': ['plan_not_found'],
          'billingItems.coupons.0.id': ['coupon_not_found'],
          currency: ['invalid_currency'],
          status: ['not_approvable'],
        }),
        translate,
      )

      expect(errors).toHaveLength(3)
      expect(errors[0].message).toContain('text_1786540789742q2ym1u6mrwh(index=1)')
      expect(errors[1].message).toContain('text_1786540789742q2ym1u6mrwh(index=2)')
      expect(errors[2].message).toContain('text_1786540789742ofilmd17tfv(index=1)')
    })

    it('deduplicates identical messages', () => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', {
          somethingElse: ['who_knows'],
          somethingElseAgain: ['who_knows_either'],
        }),
        translate,
      )

      expect(errors).toEqual([{ message: GENERIC_ERROR_KEY }])
    })
  })

  describe('order-form scope', () => {
    it.each([
      ['orderForm', 'not_found', 'text_1786610894641duk7n532hdi'],
      ['status', 'not_signable', 'text_1786610894641lt5jhzuiulg'],
      ['status', 'not_voidable', 'text_1786610894641usymql0rk8r'],
      ['signedDocument', 'invalid_format', 'text_1786610894641nv1aitlslgu'],
      ['orderFormId', 'value_already_exist', 'text_17866108946418951e8uxdcl'],
    ])('maps %s.%s to its own message', (field, code, expectedKey) => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', { [field]: [code] }),
        translate,
        'orderForm',
      )

      expect(errors).toEqual([{ message: expectedKey, field: undefined }])
    })

    it.each([
      ['executionMode', 'value_is_mandatory', 'text_17866108946411ovi8xqry3n'],
      ['executionMode', 'value_is_invalid', 'text_1786610894641m8ffsiodyjw'],
      ['executeAt', 'invalid_date', 'text_1786610894641sjyf79n6nny'],
    ])('flags %s.%s as a form field error', (field, code, expectedKey) => {
      const errors = getQuoteMutationErrors(
        makeError('unprocessable_entity', { [field]: [code] }),
        translate,
        'orderForm',
      )

      expect(errors).toEqual([{ message: expectedKey, field, messageKey: expectedKey }])
    })

    it('names the order form, not the quote version, on the shared not_voidable key', () => {
      const details = { status: ['not_voidable'] }

      expect(getQuoteMutationErrors(makeError('unprocessable_entity', details), translate)).toEqual(
        [{ message: 'text_1786540789742nso5acvqa28', field: undefined }],
      )
      expect(
        getQuoteMutationErrors(makeError('unprocessable_entity', details), translate, 'orderForm'),
      ).toEqual([{ message: 'text_1786610894641usymql0rk8r', field: undefined }])
    })

    it('keeps the quote messages for details the scope does not override', () => {
      const errors = getQuoteMutationErrors(
        makeError('not_found', { quoteVersion: ['not_found'] }),
        translate,
        'orderForm',
      )

      expect(errors).toEqual([{ message: 'text_178654078974209u9bigc6ta', field: undefined }])
    })

    it('reports permission and premium failures the same way as the quote scope', () => {
      expect(getQuoteMutationErrors(makeError('forbidden'), translate, 'orderForm')).toEqual([
        { message: 'text_17865407897429mqm1fco12j' },
      ])
      expect(
        getQuoteMutationErrors(makeError('feature_unavailable'), translate, 'orderForm'),
      ).toEqual([{ message: 'text_1786540789742kokuwxcy86s' }])
    })

    it('leaves an unknown detail on the generic message, and an unhandled code to the link', () => {
      expect(
        getQuoteMutationErrors(
          makeError('unprocessable_entity', { status: ['who_knows'] }),
          translate,
          'orderForm',
        ),
      ).toEqual([{ message: GENERIC_ERROR_KEY }])
      expect(getQuoteMutationErrors(makeError('internal_error'), translate, 'orderForm')).toEqual(
        [],
      )
    })
  })

  it('silences exactly the codes it handles locally', () => {
    expect(QUOTE_MUTATION_SILENT_ERROR_CODES).toEqual([
      'unprocessable_entity',
      'not_found',
      'feature_unavailable',
    ])
  })

  it('declares no duplicate translation keys across its maps', () => {
    const allKeys = [
      ...Object.values(TOP_LEVEL_ERROR_KEYS),
      ...Object.values(ORDER_FORM_ERROR_KEYS),
      ...Object.values(BILLING_ITEM_FIELD_ERROR_KEYS),
      ...Object.values(BILLING_ITEM_CODE_KEYS),
    ]

    expect(new Set(allKeys).size).toBe(allKeys.length)
  })
})
