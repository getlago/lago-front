import { screen } from '@testing-library/react'

import { RateCardRateBillingIntervalUnitEnum, RateCardRateModelEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { RatePhaseDurationChip } from '../RatePhaseDurationChip'
import { RatePhaseRateChip } from '../RatePhaseRateChip'

describe('RatePhaseRateChip', () => {
  it('GIVEN an overridden phase THEN reads "Overridden"', async () => {
    render(<RatePhaseRateChip isOverridden />)

    expect(await screen.findByText('Overridden')).toBeInTheDocument()
  })

  it('GIVEN a phase on the active rate THEN reads "Active rate"', async () => {
    render(<RatePhaseRateChip isOverridden={false} />)

    expect(await screen.findByText('Active rate')).toBeInTheDocument()
  })
})

describe('RatePhaseDurationChip', () => {
  it('GIVEN no cycle count THEN reads "Forever"', async () => {
    render(<RatePhaseDurationChip cycleCount={null} rate={undefined} />)

    expect(await screen.findByText('Forever')).toBeInTheDocument()
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

    expect(await screen.findByText('42 days')).toBeInTheDocument()
  })
})
