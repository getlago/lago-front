import { screen, waitFor } from '@testing-library/react'

import {
  CurrencyEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateOverrideInput,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID, RatePhaseDetailItem } from '../RatePhaseDetailItem'
import {
  getRateHistoryPath,
  RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID,
  RATE_PHASE_RATE_EFFECTIVE_DATE_TEST_ID,
  RatePhaseRateEffectiveDate,
} from '../RatePhaseRateEffectiveDate'
import {
  RATE_PHASE_RATE_PROPERTIES_TEST_ID,
  RatePhaseRateProperties,
} from '../RatePhaseRateProperties'

// Pinned literally: jsdom applies no Tailwind, so a broken selector only shows here.
const EVERY_CELL_HIGHLIGHT = '[&_tbody_td>*]:bg-purple-100'
const ALL_BUT_FIRST_COLUMN_HIGHLIGHT = '[&_tbody_td:not(:first-child)>*]:bg-purple-100'

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
    const { container } = render(<RatePhaseDetailItem label="Model" value="Standard" />)

    await waitFor(() => expect(container).toHaveTextContent('Standard'))
    expect(screen.queryByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)).not.toBeInTheDocument()
  })
})

describe('RatePhaseRateProperties', () => {
  it('GIVEN an overridden tiered rate THEN highlights every column but the first', async () => {
    render(
      <RatePhaseRateProperties
        rate={graduatedRate}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={undefined}
        isOverridden
      />,
    )

    const wrapper = await screen.findByTestId(RATE_PHASE_RATE_PROPERTIES_TEST_ID)

    expect(wrapper).toHaveClass(ALL_BUT_FIRST_COLUMN_HIGHLIGHT)
    expect(wrapper).not.toHaveClass(EVERY_CELL_HIGHLIGHT)
  })

  it('GIVEN an overridden standard rate THEN highlights every cell', async () => {
    render(
      <RatePhaseRateProperties
        rate={standardRate}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={undefined}
        isOverridden
      />,
    )

    const wrapper = await screen.findByTestId(RATE_PHASE_RATE_PROPERTIES_TEST_ID)

    expect(wrapper).toHaveClass(EVERY_CELL_HIGHLIGHT)
    expect(wrapper).not.toHaveClass(ALL_BUT_FIRST_COLUMN_HIGHLIGHT)
  })

  it('GIVEN a rate that is not overridden THEN highlights nothing', async () => {
    render(
      <RatePhaseRateProperties
        rate={standardRate}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={undefined}
        isOverridden={false}
      />,
    )

    const wrapper = await screen.findByTestId(RATE_PHASE_RATE_PROPERTIES_TEST_ID)

    expect(wrapper).not.toHaveClass(EVERY_CELL_HIGHLIGHT)
    expect(wrapper).not.toHaveClass(ALL_BUT_FIRST_COLUMN_HIGHLIGHT)
  })
})

describe('getRateHistoryPath', () => {
  it('GIVEN an organization slug THEN points to the rate card rates tab of that org', () => {
    expect(getRateHistoryPath('rc-1', 'acme')).toBe('/acme/product-catalog/rate-cards/rc-1/rates')
  })
})

describe('RatePhaseRateEffectiveDate', () => {
  it('GIVEN a rate history path THEN shows the UTC date and links to that path in a new tab', async () => {
    render(
      <RatePhaseRateEffectiveDate
        effectiveFrom="2026-01-01T00:00:00.000Z"
        rateHistoryPath="/acme/product-catalog/rate-cards/rc-1/rates"
      />,
    )

    expect(await screen.findByTestId(RATE_PHASE_RATE_EFFECTIVE_DATE_TEST_ID)).toHaveTextContent(
      'Jan 1, 2026',
    )

    const link = screen
      .getAllByTestId(RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID)
      .find((element) => element.tagName === 'A')

    expect(link).toHaveAttribute('href', '/acme/product-catalog/rate-cards/rc-1/rates')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
