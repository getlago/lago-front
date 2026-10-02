import { screen } from '@testing-library/react'

import { CouponCodeSnippet } from '~/components/coupons/CouponCodeSnippet'
import {
  CouponExpiration,
  CouponFrequency,
  CouponTypeEnum,
  CurrencyEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

const CODE_SNIPPET_TEST_ID = 'code-snippet'

jest.mock('~/components/CodeSnippet', () => ({
  CodeSnippet: ({ code }: { code: string }) => <pre data-test="code-snippet">{code}</pre>,
}))

type SnippetCoupon = NonNullable<Parameters<typeof CouponCodeSnippet>[0]['coupon']>

const buildCoupon = (overrides: Partial<SnippetCoupon>): SnippetCoupon => ({
  name: 'Summer sale',
  code: 'SUMMER',
  couponType: CouponTypeEnum.FixedAmount,
  expiration: CouponExpiration.NoExpiration,
  frequency: CouponFrequency.Once,
  ...overrides,
})

const renderSnippet = (overrides: Partial<SnippetCoupon>) =>
  render(
    <CouponCodeSnippet
      coupon={buildCoupon(overrides)}
      hasPlanLimit={false}
      hasBillableMetricLimit={false}
    />,
  )

const getSnippet = () => screen.getByTestId(CODE_SNIPPET_TEST_ID).textContent ?? ''

describe('CouponCodeSnippet', () => {
  describe('GIVEN a recurring coupon whose duration comes from the form', () => {
    describe('WHEN the duration is the string the input stores', () => {
      it('THEN should emit it unquoted, as the API expects an integer', () => {
        renderSnippet({
          amountCents: '20',
          amountCurrency: CurrencyEnum.Usd,
          frequency: CouponFrequency.Recurring,
          frequencyDuration: '12',
        })

        expect(getSnippet()).toContain('"frequency_duration": 12')
        expect(getSnippet()).not.toContain('"frequency_duration": "12"')
      })
    })
  })

  describe('GIVEN a percentage coupon whose rate comes from the form', () => {
    describe('WHEN the rate is the string the input stores', () => {
      it('THEN should emit it unquoted', () => {
        renderSnippet({
          couponType: CouponTypeEnum.Percentage,
          percentageRate: '10.5',
        })

        expect(getSnippet()).toContain('"percentage_rate": 10.5')
        expect(getSnippet()).not.toContain('"percentage_rate": "10.5"')
      })
    })
  })

  describe('GIVEN a coupon with no code yet', () => {
    describe('WHEN the snippet renders', () => {
      it('THEN should show the fill-the-form placeholder', () => {
        renderSnippet({ code: '' })

        expect(getSnippet()).toContain('Fill the form to generate the code snippet')
      })
    })
  })
})
