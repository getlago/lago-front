import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'
import { render } from '~/test-utils'

import {
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormValues,
} from '../drawers/ratePhase/ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from '../drawers/ratePhase/types'
import { RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID } from '../RatePhaseDetailItem'
import {
  RATE_PHASE_DETAILS_CONVERSION_RATE_TEST_ID,
  RATE_PHASE_DETAILS_PANEL_TEST_ID,
  RATE_PHASE_DETAILS_SPENDING_MINIMUM_TEST_ID,
} from '../RatePhaseDetailsPanel'
import { RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID } from '../RatePhaseRateEffectiveDate'
import { RATE_PHASE_RATE_PROPERTIES_TEST_ID } from '../RatePhaseRateProperties'
import {
  getRatePhaseActionsTestId,
  getRatePhaseToggleTestId,
  RATE_PHASE_DELETE_ACTION_TEST_ID,
  RATE_PHASE_EDIT_ACTION_TEST_ID,
  RATE_PHASE_REVERT_ACTION_TEST_ID,
  RATE_PHASE_TABLE_TEST_ID,
  RatePhaseTable,
} from '../RatePhaseTable'

const rateCard: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Fixed,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  activeRate: {
    __typename: 'RateCardRate',
    id: 'active-rate',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    rateModel: RateCardRateModelEnum.Standard,
    billingIntervalCount: 1,
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
    minAmountCents: '0',
    appliedPricingUnitConversionRate: null,
    rateProperties: { __typename: 'RateProperties', amount: '10' },
  },
}

const activeRateValues = {
  rateModel: RateCardRateModelEnum.Standard,
  properties: getRatePropertiesShape({ amount: '10' }),
  billingIntervalCount: '1',
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: '',
  conversionRate: '',
}

const overriddenPhase: RatePhaseFormValues = {
  ...RATE_PHASE_FORM_DEFAULTS,
  ...activeRateValues,
  code: 'intro',
  name: 'Intro',
  durationType: 'finite',
  durationCycleCount: '1',
  overrideEnabled: true,
  billingIntervalCount: '14',
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Day,
}

const foreverPhase: RatePhaseFormValues = {
  ...RATE_PHASE_FORM_DEFAULTS,
  ...activeRateValues,
  code: 'evergreen',
  name: '',
  durationType: 'forever',
}

const callbacks = {
  onEdit: jest.fn(),
  onRevert: jest.fn(),
  onDelete: jest.fn(),
}

const renderTable = (phases: RatePhaseFormValues[] = [overriddenPhase, foreverPhase]) =>
  render(<RatePhaseTable phases={phases} rateCardId="rc-1" rateCard={rateCard} {...callbacks} />)

const openActions = async (index: number): Promise<void> => {
  await userEvent.click(screen.getByTestId(getRatePhaseActionsTestId(index)))
}

describe('RatePhaseTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GIVEN phases THEN each row shows its position, name (code fallback), duration and rate chips', async () => {
    renderTable()

    const table = screen.getByTestId(RATE_PHASE_TABLE_TEST_ID)

    expect(await within(table).findByText('14 days')).toBeInTheDocument()
    expect(within(table).getByText('Intro')).toBeInTheDocument()
    expect(within(table).getByText('evergreen')).toBeInTheDocument()
    expect(within(table).getByText('Forever')).toBeInTheDocument()
    expect(within(table).getByText('Overridden')).toBeInTheDocument()
    expect(within(table).getByText('Active rate')).toBeInTheDocument()
  })

  it('GIVEN a collapsed row WHEN its caret is clicked THEN its details panel toggles', async () => {
    renderTable()

    expect(screen.queryByTestId(RATE_PHASE_DETAILS_PANEL_TEST_ID)).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    const panel = screen.getByTestId(RATE_PHASE_DETAILS_PANEL_TEST_ID)

    expect(within(panel).getByText('From contract start → 1 cycle (14 days)')).toBeInTheDocument()
    expect(within(panel).getByText('Every 14 days')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    expect(screen.queryByTestId(RATE_PHASE_DETAILS_PANEL_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN an overridden phase THEN only the fields that differ from the active rate are highlighted', async () => {
    renderTable([overriddenPhase])

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    const highlighted = screen.getAllByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)

    expect(highlighted).toHaveLength(1)
    expect(highlighted[0]).toHaveTextContent('Every 14 days')
  })

  it('GIVEN a phase on the active rate THEN its panel shows the rate effective date and no highlight', async () => {
    renderTable([foreverPhase])

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    const panel = screen.getByTestId(RATE_PHASE_DETAILS_PANEL_TEST_ID)

    expect(within(panel).getByText('Rate effective date')).toBeInTheDocument()
    expect(within(panel).getByText('From contract start → Forever')).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN a phase on the active rate THEN "See rate history" opens the rate card rates tab in a new tab', async () => {
    window.history.pushState({}, '', '/acme/plan-pricing/plan-1/overview/rate-cards')
    renderTable([foreverPhase])

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    const link = screen
      .getAllByTestId(RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID)
      .find((element) => element.tagName === 'A')

    expect(link).toHaveAttribute('href', '/acme/product-catalog/rate-cards/rc-1/rates')
    expect(link).toHaveAttribute('target', '_blank')
    window.history.pushState({}, '', '/')
  })

  it('GIVEN a rate card with a pricing unit THEN the spending minimum reads in that unit', async () => {
    render(
      <RatePhaseTable
        phases={[{ ...overriddenPhase, minAmountCents: '5', conversionRate: '1' }]}
        rateCardId="rc-1"
        rateCard={{ ...rateCard, appliedPricingUnitCode: 'CR' }}
        {...callbacks}
      />,
    )

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    expect(screen.getByTestId(RATE_PHASE_DETAILS_SPENDING_MINIMUM_TEST_ID).textContent).toBe('5 CR')
  })

  it('GIVEN a pricing unit code unknown to the organization THEN the conversion rate falls back to the code', async () => {
    render(
      <RatePhaseTable
        phases={[{ ...overriddenPhase, conversionRate: '1' }]}
        rateCardId="rc-1"
        rateCard={{ ...rateCard, appliedPricingUnitCode: 'CR' }}
        {...callbacks}
      />,
    )

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    expect(
      (await screen.findByTestId(RATE_PHASE_DETAILS_CONVERSION_RATE_TEST_ID)).textContent,
    ).toBe('CR • 1 CR = $1.00')
  })

  it('GIVEN a rate card billed in advance THEN the panel shows no spending minimum', async () => {
    render(
      <RatePhaseTable
        phases={[overriddenPhase]}
        rateCardId="rc-1"
        rateCard={{ ...rateCard, billingTiming: RateCardBillingTimingEnum.Advance }}
        {...callbacks}
      />,
    )

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    expect(
      await within(screen.getByTestId(RATE_PHASE_DETAILS_PANEL_TEST_ID)).findByTestId(
        RATE_PHASE_RATE_PROPERTIES_TEST_ID,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(RATE_PHASE_DETAILS_SPENDING_MINIMUM_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('GIVEN no spending minimum THEN the panel shows a dash, not a zero amount', async () => {
    renderTable([foreverPhase])

    await userEvent.click(screen.getByTestId(getRatePhaseToggleTestId(0)))

    expect(screen.getByTestId(RATE_PHASE_DETAILS_SPENDING_MINIMUM_TEST_ID).textContent).toBe('-')
  })

  it('GIVEN an overridden phase WHEN its actions open THEN edit, revert and delete call back with its index', async () => {
    renderTable()

    await openActions(0)
    await userEvent.click(screen.getByTestId(RATE_PHASE_REVERT_ACTION_TEST_ID))
    expect(callbacks.onRevert).toHaveBeenCalledWith(0)

    await openActions(0)
    await userEvent.click(screen.getByTestId(RATE_PHASE_EDIT_ACTION_TEST_ID))
    expect(callbacks.onEdit).toHaveBeenCalledWith(0)

    await openActions(0)
    await userEvent.click(screen.getByTestId(RATE_PHASE_DELETE_ACTION_TEST_ID))
    expect(callbacks.onDelete).toHaveBeenCalledWith(0)
  })

  it('GIVEN a phase on the active rate WHEN its actions open THEN revert is not offered', async () => {
    renderTable()

    await openActions(1)

    expect(screen.getByTestId(RATE_PHASE_EDIT_ACTION_TEST_ID)).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_REVERT_ACTION_TEST_ID)).not.toBeInTheDocument()
  })
})
