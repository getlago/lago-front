import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RateCardForRatePhaseFields } from '~/components/appliedRateCards/drawers/ratePhase/types'
import { RATE_PHASE_DURATION_CHIP_TEST_ID } from '~/components/appliedRateCards/RatePhaseDurationChip'
import {
  RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID,
  RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID,
} from '~/components/appliedRateCards/RatePhaseRateChip'
import { OPEN_ACTION_BUTTON_TEST_ID } from '~/components/designSystem/Table/Table'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import {
  APPLIED_RATE_CARD_PHASE_NAME_TEST_ID,
  APPLIED_RATE_CARD_PHASE_POSITION_TEST_ID,
  APPLIED_RATE_CARD_PHASE_RATE_EMPTY_TEST_ID,
  APPLIED_RATE_CARD_PHASES_PAGE_SIZE,
  APPLIED_RATE_CARD_PHASES_TABLE_TEST_ID,
  AppliedRateCardPhasesTable,
  getAppliedRateCardPhaseRowTestId,
} from '../AppliedRateCardPhasesTable'
import type { RatePhaseAction } from '../useRatePhaseActions'

const COPY_ACTION_TEST_ID = 'phase-action-copy'
const DELETE_ACTION_TEST_ID = 'phase-action-delete'
const COPY_ACTION_LABEL = 'Copy phase code'
const DELETE_ACTION_LABEL = 'Delete phase'

const RATE_CARD: RateCardForRatePhaseFields = {
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

const RATE_OVERRIDE: NonNullable<RatePhaseForDrawerFragment['rateOverride']> = {
  __typename: 'RateOverride',
  rateModel: RateCardRateModelEnum.Standard,
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: '0',
  pricingUnitConversionRate: null,
  rateProperties: { __typename: 'RateProperties', amount: '25' },
}

const OVERRIDDEN_PHASE: RatePhaseForDrawerFragment = {
  __typename: 'RatePhase',
  id: 'phase-1',
  code: 'ramp_up',
  name: 'Ramp up',
  position: 1,
  billingIntervalCycleCount: 3,
  rateOverride: RATE_OVERRIDE,
}

const FOREVER_PHASE: RatePhaseForDrawerFragment = {
  __typename: 'RatePhase',
  id: 'phase-2',
  code: 'steady',
  name: null,
  position: 2,
  billingIntervalCycleCount: null,
  rateOverride: null,
}

const buildPhases = (count: number): RatePhaseForDrawerFragment[] =>
  Array.from({ length: count }, (_, index) => ({
    __typename: 'RatePhase',
    id: `phase-${index + 1}`,
    code: `step_${index + 1}`,
    name: `Step ${index + 1}`,
    position: index + 1,
    billingIntervalCycleCount: 1,
    rateOverride: null,
  }))

const buildAction = (
  overrides: Partial<RatePhaseAction> & Pick<RatePhaseAction, 'key' | 'dataTest' | 'label'>,
): RatePhaseAction => ({
  startIcon: 'duplicate',
  disabled: false,
  onAction: jest.fn(),
  ...overrides,
})

const getPhaseHref = (phase: RatePhaseForDrawerFragment): string => `/phases/${phase.id}`

const renderTable = (
  props: Partial<Parameters<typeof AppliedRateCardPhasesTable>[0]> = {},
): ReturnType<typeof render> =>
  render(
    <AppliedRateCardPhasesTable
      phases={[OVERRIDDEN_PHASE, FOREVER_PHASE]}
      rateCard={RATE_CARD}
      getPhaseHref={getPhaseHref}
      getPhaseActions={() => []}
      {...props}
    />,
  )

describe('AppliedRateCardPhasesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  it('GIVEN phases THEN each row shows its position, display name, duration chip and rate chip', async () => {
    renderTable()

    const overriddenRow = await screen.findByTestId(getAppliedRateCardPhaseRowTestId(1))
    const foreverRow = screen.getByTestId(getAppliedRateCardPhaseRowTestId(2))

    await waitFor(() =>
      expect(within(overriddenRow).getByTestId(RATE_PHASE_DURATION_CHIP_TEST_ID)).toHaveTextContent(
        '3 months',
      ),
    )

    expect(
      within(overriddenRow).getByTestId(APPLIED_RATE_CARD_PHASE_POSITION_TEST_ID),
    ).toHaveTextContent(/^1$/)
    expect(
      within(overriddenRow).getByTestId(APPLIED_RATE_CARD_PHASE_NAME_TEST_ID),
    ).toHaveTextContent(/^Ramp up$/)
    expect(
      within(overriddenRow).getByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID),
    ).toBeInTheDocument()

    expect(
      within(foreverRow).getByTestId(APPLIED_RATE_CARD_PHASE_POSITION_TEST_ID),
    ).toHaveTextContent(/^2$/)
    expect(within(foreverRow).getByTestId(APPLIED_RATE_CARD_PHASE_NAME_TEST_ID)).toHaveTextContent(
      /^Phase 2$/,
    )
    expect(within(foreverRow).getByTestId(RATE_PHASE_DURATION_CHIP_TEST_ID)).toHaveTextContent(
      /^Forever$/,
    )
    expect(within(foreverRow).getByTestId(RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID)).toBeInTheDocument()
  })

  it('GIVEN a card without active rate and a phase without override THEN the rate cell shows a dash and no chip', async () => {
    renderTable({
      phases: [FOREVER_PHASE],
      rateCard: { ...RATE_CARD, activeRate: null },
    })

    const rateCell = await screen.findByTestId(APPLIED_RATE_CARD_PHASE_RATE_EMPTY_TEST_ID)

    expect(rateCell).toHaveTextContent(/^-$/)
    expect(screen.queryByTestId(RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID)).not.toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN no rate card THEN the rate cell shows a dash and the duration counts cycles', async () => {
    renderTable({ phases: [OVERRIDDEN_PHASE], rateCard: undefined })

    expect(await screen.findByTestId(APPLIED_RATE_CARD_PHASE_RATE_EMPTY_TEST_ID)).toHaveTextContent(
      /^-$/,
    )
    expect(screen.queryByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID)).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASE_DURATION_CHIP_TEST_ID)).toHaveTextContent('3 cycles'),
    )
  })

  // Guards the form default (1 month) leaking into the duration as "3 months".
  it('GIVEN an override without billing interval on a card without active rate THEN the duration counts cycles', async () => {
    renderTable({
      phases: [
        {
          ...OVERRIDDEN_PHASE,
          rateOverride: { ...RATE_OVERRIDE, billingIntervalCount: null, billingIntervalUnit: null },
        },
      ],
      rateCard: { ...RATE_CARD, activeRate: null },
    })

    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASE_DURATION_CHIP_TEST_ID)).toHaveTextContent('3 cycles'),
    )
  })

  it('GIVEN a row WHEN it is clicked THEN it navigates to the phase href', async () => {
    const user = userEvent.setup()

    renderTable()

    const row = await screen.findByTestId(getAppliedRateCardPhaseRowTestId(2))

    await user.click(within(row).getByTestId(APPLIED_RATE_CARD_PHASE_NAME_TEST_ID))

    expect(testMockNavigateFn).toHaveBeenCalledWith('/phases/phase-2')
  })

  describe('GIVEN 25 phases', () => {
    it('THEN the first page shows 20 rows WHEN the next page is opened THEN the page is written to the URL', async () => {
      const user = userEvent.setup()

      renderTable({ phases: buildPhases(25) })

      expect(await screen.findAllByTestId(APPLIED_RATE_CARD_PHASE_POSITION_TEST_ID)).toHaveLength(
        APPLIED_RATE_CARD_PHASES_PAGE_SIZE,
      )
      expect(screen.queryByTestId(getAppliedRateCardPhaseRowTestId(21))).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'next page' }))

      expect(testMockNavigateFn).toHaveBeenCalledWith({ search: 'page=2' }, { replace: true })
    })

    it('GIVEN the second page in the URL THEN rows 21 to 25 keep their own link and actions', async () => {
      const user = userEvent.setup()
      const onCopy = jest.fn()

      window.history.pushState({}, '', '/?page=2')
      renderTable({
        phases: buildPhases(25),
        getPhaseActions: (phase) => [
          buildAction({
            key: 'copy',
            label: COPY_ACTION_LABEL,
            dataTest: COPY_ACTION_TEST_ID,
            onAction: () => onCopy(phase.id),
          }),
        ],
      })

      expect(await screen.findAllByTestId(APPLIED_RATE_CARD_PHASE_POSITION_TEST_ID)).toHaveLength(5)
      expect(screen.queryByTestId(getAppliedRateCardPhaseRowTestId(1))).not.toBeInTheDocument()

      const lastRow = screen.getByTestId(getAppliedRateCardPhaseRowTestId(25))

      expect(within(lastRow).getByRole('link', { name: 'Step 25' })).toHaveAttribute(
        'href',
        '/phases/phase-25',
      )

      await user.click(within(lastRow).getByTestId(OPEN_ACTION_BUTTON_TEST_ID))
      await user.click(screen.getByTestId(COPY_ACTION_TEST_ID))

      expect(onCopy).toHaveBeenCalledTimes(1)
      expect(onCopy).toHaveBeenCalledWith('phase-25')
    })

    it('GIVEN the second page in the URL WHEN the phases shrink to one page THEN the URL falls back to the first page', async () => {
      window.history.pushState({}, '', '/?page=2')
      const { rerender } = renderTable({ phases: buildPhases(21) })

      expect(await screen.findAllByTestId(APPLIED_RATE_CARD_PHASE_POSITION_TEST_ID)).toHaveLength(1)

      rerender(
        <AppliedRateCardPhasesTable
          phases={buildPhases(20)}
          rateCard={RATE_CARD}
          getPhaseHref={getPhaseHref}
          getPhaseActions={() => []}
        />,
      )

      await waitFor(() =>
        expect(testMockNavigateFn).toHaveBeenCalledWith({ search: '' }, { replace: true }),
      )
    })
  })

  describe('GIVEN actions', () => {
    it('WHEN an action is clicked THEN its onAction runs', async () => {
      const user = userEvent.setup()
      const onCopy = jest.fn()

      renderTable({
        getPhaseActions: () => [
          buildAction({
            key: 'copy',
            label: COPY_ACTION_LABEL,
            dataTest: COPY_ACTION_TEST_ID,
            onAction: onCopy,
          }),
        ],
      })

      const row = await screen.findByTestId(getAppliedRateCardPhaseRowTestId(1))

      await user.click(within(row).getByTestId(OPEN_ACTION_BUTTON_TEST_ID))

      expect(screen.getByTestId(COPY_ACTION_TEST_ID)).toHaveTextContent(COPY_ACTION_LABEL)

      await user.click(screen.getByTestId(COPY_ACTION_TEST_ID))

      expect(onCopy).toHaveBeenCalledTimes(1)
    })

    it('WHEN an action is disabled THEN it is rendered disabled', async () => {
      const user = userEvent.setup()

      renderTable({
        getPhaseActions: () => [
          buildAction({
            key: 'delete',
            label: DELETE_ACTION_LABEL,
            dataTest: DELETE_ACTION_TEST_ID,
            startIcon: 'trash',
            disabled: true,
          }),
        ],
      })

      const row = await screen.findByTestId(getAppliedRateCardPhaseRowTestId(1))

      await user.click(within(row).getByTestId(OPEN_ACTION_BUTTON_TEST_ID))

      expect(screen.getByTestId(DELETE_ACTION_TEST_ID)).toBeDisabled()
    })
  })

  it('GIVEN phases THEN the table is rendered inside its test id container', async () => {
    renderTable()

    expect(await screen.findByTestId(APPLIED_RATE_CARD_PHASES_TABLE_TEST_ID)).toBeInTheDocument()
  })
})
