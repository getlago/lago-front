import { screen } from '@testing-library/react'

import {
  CurrencyEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateOverrideInput,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID, RatePhaseDetailItem } from '../RatePhaseDetailItem'
import {
  RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID,
  RatePhaseRateEffectiveDate,
} from '../RatePhaseRateEffectiveDate'
import { RatePhaseRateProperties } from '../RatePhaseRateProperties'

const standardRate: RateOverrideInput = {
  rateModel: RateCardRateModelEnum.Standard,
  rateProperties: { amount: '10' },
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
}

const graduatedRate: RateOverrideInput = {
  rateModel: RateCardRateModelEnum.Graduated,
  rateProperties: {
    graduatedRanges: [
      { toValue: '10', perUnitAmount: '1', flatAmount: '0' },
      { toValue: null, perUnitAmount: '0.5', flatAmount: '0' },
    ],
  },
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
}

describe('RatePhaseDetailItem', () => {
  it('GIVEN an overridden value THEN carries the overridden test id', async () => {
    render(<RatePhaseDetailItem label="Model" value="Standard" isOverridden />)

    expect(await screen.findByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)).toHaveTextContent(
      'Standard',
    )
  })

  it('GIVEN a value that is not overridden THEN has no overridden test id', async () => {
    render(<RatePhaseDetailItem label="Model" value="Standard" />)

    expect(await screen.findByText('Standard')).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)).not.toBeInTheDocument()
  })
})

describe('RatePhaseRateProperties', () => {
  it('GIVEN an overridden tiered rate THEN highlights every column but the first', async () => {
    const { container } = render(
      <RatePhaseRateProperties
        rate={graduatedRate}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={undefined}
        isOverridden
      />,
    )

    expect(await screen.findByText('For the units')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain(
      '[&_tbody_td:not(:first-child)>*]:bg-purple-100',
    )
  })

  it('GIVEN an overridden standard rate THEN highlights every cell', async () => {
    const { container } = render(
      <RatePhaseRateProperties
        rate={standardRate}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={undefined}
        isOverridden
      />,
    )

    expect(await screen.findByText('$10.00')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain('[&_tbody_td>*]:bg-purple-100')
  })

  it('GIVEN a rate that is not overridden THEN highlights nothing', async () => {
    const { container } = render(
      <RatePhaseRateProperties
        rate={standardRate}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={undefined}
        isOverridden={false}
      />,
    )

    expect(await screen.findByText('$10.00')).toBeInTheDocument()
    expect(container.firstElementChild?.className ?? '').not.toContain('bg-purple-100')
  })
})

describe('RatePhaseRateEffectiveDate', () => {
  it('GIVEN an org-scoped URL THEN shows the UTC date and links to the rate card rates tab of that org', async () => {
    window.history.pushState({}, '', '/acme/contracts/c-1/rate-cards/arc-1')
    render(
      <RatePhaseRateEffectiveDate effectiveFrom="2026-01-01T00:00:00.000Z" rateCardId="rc-1" />,
    )

    expect(await screen.findByText('See rate history')).toBeInTheDocument()

    const link = screen
      .getAllByTestId(RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID)
      .find((element) => element.tagName === 'A')

    expect(screen.getByText('Jan 1, 2026')).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/acme/product-catalog/rate-cards/rc-1/rates')
    window.history.pushState({}, '', '/')
  })
})
