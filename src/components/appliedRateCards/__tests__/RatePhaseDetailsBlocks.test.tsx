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
  RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID,
  RATE_PHASE_RATE_EFFECTIVE_DATE_TEST_ID,
  RatePhaseRateEffectiveDate,
} from '../RatePhaseRateEffectiveDate'
import {
  OVERRIDDEN_RATE_PROPERTIES_CLASSNAME,
  OVERRIDDEN_TIERED_RATE_PROPERTIES_CLASSNAME,
  RATE_PHASE_RATE_PROPERTIES_TEST_ID,
  RatePhaseRateProperties,
} from '../RatePhaseRateProperties'

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

    expect(wrapper).toHaveClass(OVERRIDDEN_TIERED_RATE_PROPERTIES_CLASSNAME)
    expect(wrapper).not.toHaveClass(OVERRIDDEN_RATE_PROPERTIES_CLASSNAME)
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

    expect(wrapper).toHaveClass(OVERRIDDEN_RATE_PROPERTIES_CLASSNAME)
    expect(wrapper).not.toHaveClass(OVERRIDDEN_TIERED_RATE_PROPERTIES_CLASSNAME)
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

    expect(wrapper).not.toHaveClass(OVERRIDDEN_RATE_PROPERTIES_CLASSNAME)
    expect(wrapper).not.toHaveClass(OVERRIDDEN_TIERED_RATE_PROPERTIES_CLASSNAME)
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
