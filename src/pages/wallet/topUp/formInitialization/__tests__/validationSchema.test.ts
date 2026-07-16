import { MetadataErrorsEnum } from '~/formValidation/metadataSchema'
import { CurrencyEnum } from '~/generated/graphql'
import { TopUpAmountError } from '~/pages/wallet/form'
import { TWalletTopUpDataForm } from '~/pages/wallet/topUp/types'

import {
  getTopUpFormValidationSchema,
  topUpFormErrorLabels,
  TopUpValidationContext,
} from '../validationSchema'

const noBounds: TopUpValidationContext = {
  rateAmount: '2',
  paidTopUpMinAmountCents: undefined,
  paidTopUpMaxAmountCents: undefined,
  currency: CurrencyEnum.Eur,
}

const withBounds: TopUpValidationContext = {
  rateAmount: '2',
  paidTopUpMinAmountCents: '10',
  paidTopUpMaxAmountCents: '100',
  currency: CurrencyEnum.Eur,
}

const baseForm = (overrides: Partial<TWalletTopUpDataForm> = {}): TWalletTopUpDataForm => ({
  grantedCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  paidCredits: '10',
  name: undefined,
  metadata: undefined,
  ignorePaidTopUpLimits: undefined,
  priority: 50,
  ...overrides,
})

type ParseResult = ReturnType<ReturnType<typeof getTopUpFormValidationSchema>['safeParse']>

const parse = (
  values: TWalletTopUpDataForm,
  context: TopUpValidationContext = noBounds,
): ParseResult => getTopUpFormValidationSchema(context).safeParse(values)

const issuePaths = (result: ParseResult): string[] =>
  result.success ? [] : result.error.issues.map((i) => i.path.join('.'))

const issueFor = (result: ParseResult, path: string) =>
  result.success ? undefined : result.error.issues.find((i) => i.path.join('.') === path)

describe('getTopUpFormValidationSchema', () => {
  describe('GIVEN the at-least-one-credits rule', () => {
    describe('WHEN one credit amount is set', () => {
      it.each([
        ['paid only', { paidCredits: '10', grantedCredits: '' }],
        ['granted only', { paidCredits: '', grantedCredits: '5' }],
        ['both', { paidCredits: '10', grantedCredits: '5' }],
      ])('THEN should pass (%s)', (_, credits) => {
        expect(parse(baseForm(credits)).success).toBe(true)
      })
    })

    describe('WHEN both credit amounts are absent', () => {
      it.each([
        // empty strings count as missing — Formik ran Yup on
        // prepareDataForValidation(values) which converts '' to undefined
        ['empty strings', ''],
        ['undefined', undefined],
      ])('THEN should fail on both credit fields (%s)', (_, emptyValue) => {
        const result = parse(
          baseForm({
            paidCredits: emptyValue as unknown as string,
            grantedCredits: emptyValue as unknown as string,
          }),
        )

        expect(issuePaths(result).sort()).toEqual(['grantedCredits', 'paidCredits'])
        expect(issueFor(result, 'paidCredits')?.message).toBe(topUpFormErrorLabels.required)
        expect(issueFor(result, 'grantedCredits')?.message).toBe(topUpFormErrorLabels.required)
      })
    })
  })

  describe('GIVEN the wallet has paid top-up bounds', () => {
    describe('WHEN the paid amount falls outside them', () => {
      it.each([
        ['below the minimum', '1'],
        ['above the maximum', '1000'],
      ])('THEN should fail on paidCredits with a bounds marker (%s)', (_, paidCredits) => {
        const result = parse(baseForm({ paidCredits }), withBounds)

        expect(issuePaths(result)).toEqual(['paidCredits'])
        expect(issueFor(result, 'paidCredits')?.message).toBe(TopUpAmountError.NotBetween)
      })
    })

    describe('WHEN the paid amount is within them', () => {
      it('THEN should pass', () => {
        expect(parse(baseForm({ paidCredits: '25' }), withBounds).success).toBe(true)
      })
    })

    describe('WHEN the ignore-limits switch is on', () => {
      it('THEN should skip the bounds check', () => {
        const result = parse(
          baseForm({ paidCredits: '1000', ignorePaidTopUpLimits: true }),
          withBounds,
        )

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN only granted credits are set', () => {
      it('THEN should not run the bounds check', () => {
        const result = parse(baseForm({ paidCredits: '', grantedCredits: '5' }), withBounds)

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN the wallet query has not resolved yet', () => {
    describe('WHEN validating with an empty context', () => {
      it('THEN should skip the bounds check but keep the credits rule', () => {
        const emptyContext: TopUpValidationContext = {
          rateAmount: undefined,
          paidTopUpMinAmountCents: undefined,
          paidTopUpMaxAmountCents: undefined,
          currency: undefined,
        }

        expect(parse(baseForm(), emptyContext).success).toBe(true)
        expect(
          issuePaths(parse(baseForm({ paidCredits: '', grantedCredits: '' }), emptyContext)).sort(),
        ).toEqual(['grantedCredits', 'paidCredits'])
      })
    })
  })

  describe('GIVEN metadata rows', () => {
    describe('WHEN the rows are valid', () => {
      it.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty array', []],
        [
          'filled rows',
          [
            { key: 'a', value: 'b' },
            { key: 'c', value: 'd' },
          ],
        ],
      ])('THEN should pass (%s)', (_, metadata) => {
        expect(
          parse(baseForm({ metadata: metadata as TWalletTopUpDataForm['metadata'] })).success,
        ).toBe(true)
      })
    })

    describe('WHEN a key is duplicated', () => {
      it('THEN should fail on the duplicated keys with the uniqueness marker', () => {
        const result = parse(
          baseForm({
            metadata: [
              { key: 'a', value: 'b' },
              { key: 'a', value: 'd' },
            ],
          }),
        )

        expect(issuePaths(result)).toContain('metadata.1.key')
        expect(issueFor(result, 'metadata.1.key')?.message).toBe(MetadataErrorsEnum.uniqueness)
      })
    })

    describe('WHEN a key or value exceeds its max length', () => {
      it.each([
        ['key over 20 chars', { key: 'x'.repeat(21), value: 'b' }, 'metadata.0.key'],
        ['value over 100 chars', { key: 'a', value: 'y'.repeat(101) }, 'metadata.0.value'],
      ])('THEN should fail with the maxLength marker (%s)', (_, row, path) => {
        const result = parse(baseForm({ metadata: [row] }))

        expect(issueFor(result, path)?.message).toBe(MetadataErrorsEnum.maxLength)
      })
    })

    describe('WHEN the metadata shape is malformed', () => {
      it('THEN should fail on metadata without throwing', () => {
        const result = parse(
          baseForm({
            metadata: {
              0: { key: 'a', value: 'b' },
            } as unknown as TWalletTopUpDataForm['metadata'],
          }),
        )

        expect(result.success).toBe(false)
        expect(issuePaths(result)).toEqual(['metadata'])
      })
    })
  })

  describe('GIVEN fields the old Yup schema never constrained', () => {
    describe('WHEN validating', () => {
      it('THEN should not fail on priority, name or paymentMethod', () => {
        const result = parse(
          baseForm({
            priority: '' as unknown as number,
            name: 'My top-up',
            paymentMethod: { paymentMethodId: 'pm_1' },
          }),
        )

        expect(result.success).toBe(true)
      })
    })
  })
})
