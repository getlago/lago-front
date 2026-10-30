import { screen } from '@testing-library/react'

import { RateCardRateBillingIntervalUnitEnum, RateCardRateModelEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { RATE_PHASE_DURATION_CHIP_TEST_ID, RatePhaseDurationChip } from '../RatePhaseDurationChip'
import {
  RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID,
  RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID,
  RatePhaseRateChip,
} from '../RatePhaseRateChip'

describe('RatePhaseRateChip', () => {
  it('GIVEN an overridden phase THEN renders the overridden chip only', async () => {
    render(<RatePhaseRateChip isOverridden />)

    expect(await screen.findByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID)).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN a phase on the active rate THEN renders the active rate chip only', async () => {
    render(<RatePhaseRateChip isOverridden={false} />)

    expect(await screen.findByTestId(RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID)).toBeInTheDocument()
    expect(screen.queryByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN an overridden phase and the short label THEN reads "Overridden"', async () => {
    render(<RatePhaseRateChip isOverridden />)

    expect(await screen.findByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID)).toHaveTextContent(
      /^Overridden$/,
    )
  })

  it('GIVEN an overridden phase and the long label THEN reads "Overridden rate"', async () => {
    render(<RatePhaseRateChip isOverridden labelLength="long" />)

    expect(await screen.findByTestId(RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID)).toHaveTextContent(
      'Overridden rate',
    )
  })

  it('GIVEN a phase on the active rate and the long label THEN reads "Active rate"', async () => {
    render(<RatePhaseRateChip isOverridden={false} labelLength="long" />)

    expect(await screen.findByTestId(RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID)).toHaveTextContent(
      'Active rate',
    )
  })
})

describe('RatePhaseDurationChip', () => {
  it('GIVEN no cycle count THEN reads "Forever"', async () => {
    render(<RatePhaseDurationChip cycleCount={null} rate={undefined} />)

    expect(await screen.findByTestId(RATE_PHASE_DURATION_CHIP_TEST_ID)).toHaveTextContent('Forever')
  })

  it('GIVEN 3 cycles of 14 days THEN reads the total in days', async () => {
    render(
      <RatePhaseDurationChip
        cycleCount={3}
        rate={{
          rateModel: RateCardRateModelEnum.Standard,
          rateProperties: {},
          billingIntervalCount: 14,
          billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Day,
        }}
      />,
    )

    expect(await screen.findByTestId(RATE_PHASE_DURATION_CHIP_TEST_ID)).toHaveTextContent('42 days')
  })
})
