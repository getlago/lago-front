import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RateCardForRatePhaseFields } from '~/components/appliedRateCards/drawers/ratePhase/types'
import { RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID } from '~/components/appliedRateCards/RatePhaseDetailItem'
import {
  RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID,
  RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID,
} from '~/components/appliedRateCards/RatePhaseRateChip'
import {
  RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID,
  RATE_PHASE_RATE_EFFECTIVE_DATE_TEST_ID,
} from '~/components/appliedRateCards/RatePhaseRateEffectiveDate'
import {
  OVERRIDDEN_RATE_PROPERTIES_CLASSNAME,
  RATE_PHASE_RATE_PROPERTIES_TEST_ID,
} from '~/components/appliedRateCards/RatePhaseRateProperties'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { FINITE_PHASE } from './fixtures'

import {
  RATE_PHASE_OVERVIEW_CONVERSION_RATE_TEST_ID,
  RATE_PHASE_OVERVIEW_EDIT_TEST_ID,
  RATE_PHASE_OVERVIEW_MIN_SPENDING_TEST_ID,
  RATE_PHASE_OVERVIEW_PRICING_UNIT_TEST_ID,
  RATE_PHASE_OVERVIEW_RATE_SECTION_TEST_ID,
  RATE_PHASE_OVERVIEW_SEE_ACTIVE_RATE_TEST_ID,
  RATE_PHASE_OVERVIEW_TEST_ID,
  RatePhaseDetailsOverview,
} from '../RatePhaseDetailsOverview'
import { RatePhaseSectionAction } from '../useRatePhaseActions'

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({
    hasAnyPricingUnitConfigured: true,
    pricingUnits: [{ id: 'pricing-unit-1', code: 'credits', name: 'Credits', shortName: 'CR' }],
  }),
}))

const RATE_HISTORY_PATH = '/acme/product-catalog/rate-cards/rate-card-1/rates'
const TIMELINE_14_DAYS = 'From contract start → 3 cycles of 14 days'

const ACTIVE_RATE: NonNullable<RateCardForRatePhaseFields['activeRate']> = {
  __typename: 'RateCardRate',
  id: 'active-rate',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  rateModel: RateCardRateModelEnum.Standard,
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: '0',
  appliedPricingUnitConversionRate: null,
  rateProperties: { __typename: 'RateProperties', amount: '10' },
}

const RATE_CARD: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Fixed,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  activeRate: ACTIVE_RATE,
}

const RATE_OVERRIDE: NonNullable<RatePhaseForDrawerFragment['rateOverride']> = {
  __typename: 'RateOverride',
  rateModel: RateCardRateModelEnum.Standard,
  billingIntervalCount: 14,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Day,
  minAmountCents: '500',
  pricingUnitConversionRate: null,
  rateProperties: { __typename: 'RateProperties', amount: '25' },
}

const OVERRIDDEN_PHASE: RatePhaseForDrawerFragment = {
  ...FINITE_PHASE,
  rateOverride: RATE_OVERRIDE,
}

const buildEditPhase = (
  overrides: Partial<RatePhaseSectionAction> = {},
): RatePhaseSectionAction => ({
  hidden: false,
  disabled: false,
  open: jest.fn(),
  ...overrides,
})

const renderOverview = (
  props: Partial<Parameters<typeof RatePhaseDetailsOverview>[0]> = {},
): ReturnType<typeof render> =>
  render(
    <RatePhaseDetailsOverview
      phase={OVERRIDDEN_PHASE}
      rateCard={RATE_CARD}
      rateHistoryPath={RATE_HISTORY_PATH}
      editPhase={buildEditPhase()}
      {...props}
    />,
  )

const getExternalLink = (testId: string): HTMLElement | undefined =>
  screen.getAllByTestId(testId).find((element) => element.tagName === 'A')

describe('RatePhaseDetailsOverview', () => {
  it('GIVEN a named phase THEN shows name, code, position and the timeline', async () => {
    renderOverview()

    const overview = screen.getByTestId(RATE_PHASE_OVERVIEW_TEST_ID)

    expect(await within(overview).findByText(TIMELINE_14_DAYS)).toBeInTheDocument()
    expect(within(overview).getByText('Rate phase overview')).toBeInTheDocument()
    expect(within(overview).getByText('Ramp up')).toBeInTheDocument()
    expect(within(overview).getByText('ramp_up')).toBeInTheDocument()
    expect(within(overview).getByText('1')).toBeInTheDocument()
  })

  it('GIVEN an unnamed phase THEN the name reads "-"', async () => {
    renderOverview({ phase: { ...OVERRIDDEN_PHASE, name: null } })

    expect(await screen.findByText('-')).toBeInTheDocument()
    expect(screen.queryByText('Ramp up')).not.toBeInTheDocument()
  })

  it('GIVEN an overridden phase on a card with an active rate THEN shows the long chip, "See active rate" to the rates tab, no effective date, and highlights only the fields that differ', async () => {
    renderOverview()

    expect(await screen.findByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID)).toHaveTextContent(
      'Overridden rate',
    )

    const seeActiveRateLink = getExternalLink(RATE_PHASE_OVERVIEW_SEE_ACTIVE_RATE_TEST_ID)

    expect(seeActiveRateLink).toHaveTextContent('See active rate')
    expect(seeActiveRateLink).toHaveAttribute('href', RATE_HISTORY_PATH)
    expect(seeActiveRateLink).toHaveAttribute('target', '_blank')
    expect(screen.queryByText('Rate effective date')).not.toBeInTheDocument()
    expect(
      screen
        .getAllByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)
        .map((element) => element.textContent),
    ).toEqual(['Every 14 days', '$5.00'])
    expect(screen.getByTestId(RATE_PHASE_RATE_PROPERTIES_TEST_ID)).toHaveClass(
      OVERRIDDEN_RATE_PROPERTIES_CLASSNAME,
    )
    expect(screen.getByText('Rate model')).toBeInTheDocument()
  })

  it('GIVEN an overridden phase on a card without an active rate THEN "See active rate" is absent', async () => {
    renderOverview({ rateCard: { ...RATE_CARD, activeRate: null } })

    expect(await screen.findByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID)).toHaveTextContent(
      'Overridden rate',
    )
    expect(
      screen.queryByTestId(RATE_PHASE_OVERVIEW_SEE_ACTIVE_RATE_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('GIVEN a phase on the active rate THEN shows "Active rate", the effective date with "See rate history", and no highlight', async () => {
    renderOverview({ phase: FINITE_PHASE })

    expect(await screen.findByTestId(RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID)).toHaveTextContent(
      'Active rate',
    )
    expect(screen.getByText('Rate effective date')).toBeInTheDocument()
    expect(screen.getByTestId(RATE_PHASE_RATE_EFFECTIVE_DATE_TEST_ID)).toHaveTextContent(
      'Jan 1, 2026',
    )
    expect(getExternalLink(RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID)).toHaveAttribute(
      'href',
      RATE_HISTORY_PATH,
    )
    expect(
      screen.queryByTestId(RATE_PHASE_OVERVIEW_SEE_ACTIVE_RATE_TEST_ID),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)).not.toBeInTheDocument()
    expect(screen.getByTestId(RATE_PHASE_OVERVIEW_MIN_SPENDING_TEST_ID)).toHaveTextContent(/^-$/)
  })

  it('GIVEN no override and no active rate THEN the rate section is absent', async () => {
    renderOverview({ phase: FINITE_PHASE, rateCard: { ...RATE_CARD, activeRate: null } })

    expect(await screen.findByText('From contract start → 3 cycles')).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_OVERVIEW_RATE_SECTION_TEST_ID)).not.toBeInTheDocument()
    expect(screen.queryByText('Rate')).not.toBeInTheDocument()
  })

  it('GIVEN a card with a pricing unit THEN shows "Credits" and "1 CR = $1.00"', async () => {
    renderOverview({
      phase: FINITE_PHASE,
      rateCard: {
        ...RATE_CARD,
        appliedPricingUnitCode: 'credits',
        activeRate: { ...ACTIVE_RATE, appliedPricingUnitConversionRate: 1 },
      },
    })

    expect(await screen.findByTestId(RATE_PHASE_OVERVIEW_PRICING_UNIT_TEST_ID)).toHaveTextContent(
      /^Credits$/,
    )
    expect(screen.getByTestId(RATE_PHASE_OVERVIEW_CONVERSION_RATE_TEST_ID)).toHaveTextContent(
      /^1 CR = \$1\.00$/,
    )
  })

  it('GIVEN an override of the conversion rate THEN only the conversion rate is highlighted, never the pricing unit', async () => {
    renderOverview({
      phase: {
        ...FINITE_PHASE,
        rateOverride: {
          ...RATE_OVERRIDE,
          billingIntervalCount: 1,
          billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
          minAmountCents: '0',
          pricingUnitConversionRate: 2,
          rateProperties: { __typename: 'RateProperties', amount: '10' },
        },
      },
      rateCard: {
        ...RATE_CARD,
        appliedPricingUnitCode: 'credits',
        activeRate: { ...ACTIVE_RATE, appliedPricingUnitConversionRate: 1 },
      },
    })

    expect(await screen.findByTestId(RATE_PHASE_OVERVIEW_PRICING_UNIT_TEST_ID)).toHaveTextContent(
      /^Credits$/,
    )
    expect(
      screen
        .getAllByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)
        .map((element) => element.textContent),
    ).toEqual(['1 CR = $2.00'])
  })

  it('GIVEN no pricing unit THEN neither field renders', async () => {
    renderOverview()

    expect(await screen.findByTestId(RATE_PHASE_OVERVIEW_RATE_SECTION_TEST_ID)).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_OVERVIEW_PRICING_UNIT_TEST_ID)).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(RATE_PHASE_OVERVIEW_CONVERSION_RATE_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('GIVEN a pricing unit code missing from the org list THEN the code stands in for name and short name', async () => {
    renderOverview({
      phase: FINITE_PHASE,
      rateCard: {
        ...RATE_CARD,
        appliedPricingUnitCode: 'tokens',
        activeRate: { ...ACTIVE_RATE, appliedPricingUnitConversionRate: 1 },
      },
    })

    expect(await screen.findByTestId(RATE_PHASE_OVERVIEW_PRICING_UNIT_TEST_ID)).toHaveTextContent(
      /^tokens$/,
    )
    expect(screen.getByTestId(RATE_PHASE_OVERVIEW_CONVERSION_RATE_TEST_ID)).toHaveTextContent(
      /^1 tokens = \$1\.00$/,
    )
  })

  it('GIVEN an override without interval on a 14-day active rate THEN interval and timeline read 14 days', async () => {
    renderOverview({
      phase: {
        ...FINITE_PHASE,
        rateOverride: { ...RATE_OVERRIDE, billingIntervalCount: null, billingIntervalUnit: null },
      },
      rateCard: {
        ...RATE_CARD,
        activeRate: {
          ...ACTIVE_RATE,
          billingIntervalCount: 14,
          billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Day,
        },
      },
    })

    expect(await screen.findByText(TIMELINE_14_DAYS)).toBeInTheDocument()
    expect(screen.getByText('Every 14 days')).toBeInTheDocument()
    expect(
      screen
        .getAllByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)
        .map((element) => element.textContent),
    ).not.toContain('Every 14 days')
  })

  it('GIVEN no rate card THEN the rate section is absent and the page renders', async () => {
    renderOverview({ rateCard: undefined })

    expect(await screen.findByText('From contract start → 3 cycles')).toBeInTheDocument()
    expect(screen.getByText('Ramp up')).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_OVERVIEW_RATE_SECTION_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN advance billing THEN no minimum spending', async () => {
    renderOverview({
      rateCard: { ...RATE_CARD, billingTiming: RateCardBillingTimingEnum.Advance },
    })

    expect(await screen.findByTestId(RATE_PHASE_RATE_PROPERTIES_TEST_ID)).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_OVERVIEW_MIN_SPENDING_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN the inline edit is hidden THEN no button', async () => {
    renderOverview({ editPhase: buildEditPhase({ hidden: true }) })

    expect(await screen.findByText('Rate phase overview')).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_OVERVIEW_EDIT_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN the inline edit is disabled THEN the button is disabled', async () => {
    renderOverview({ editPhase: buildEditPhase({ disabled: true }) })

    expect(await screen.findByTestId(RATE_PHASE_OVERVIEW_EDIT_TEST_ID)).toBeDisabled()
  })

  it('GIVEN the inline edit WHEN it is clicked THEN editPhase.open is called once', async () => {
    const editPhase = buildEditPhase()

    renderOverview({ editPhase })

    await userEvent.click(await screen.findByTestId(RATE_PHASE_OVERVIEW_EDIT_TEST_ID))

    expect(editPhase.open).toHaveBeenCalledTimes(1)
  })
})
