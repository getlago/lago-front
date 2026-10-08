import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RateCardRateModelEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { RATE_PHASE_FORM_DEFAULTS } from '../drawers/ratePhase/ratePhaseFormSchema'
import { RatePhaseList } from '../RatePhaseList'

const activeRate = {
  rateModel: RateCardRateModelEnum.Standard,
  rateProperties: { amount: '10' },
  billingIntervalCount: 1,
  billingIntervalUnit: 'month',
  minAmountCents: 0,
  appliedPricingUnitConversionRate: null,
} as never

const phases = [{ ...RATE_PHASE_FORM_DEFAULTS, code: 'phase-1', name: 'Phase 1' }]

describe('RatePhaseList, accordion variant', () => {
  it('GIVEN a row THEN clicking it expands the accordion detail', async () => {
    render(
      <RatePhaseList
        variant="accordion"
        phases={phases}
        activeRate={activeRate}
        onEdit={jest.fn()}
        onRemove={jest.fn()}
      />,
    )

    expect(screen.queryByText(/standard/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Phase 1'))
    expect(screen.getByText(/standard/i)).toBeInTheDocument()
  })

  it('GIVEN the edit action THEN onEdit is called with the row index', async () => {
    const onEdit = jest.fn()

    render(
      <RatePhaseList
        variant="accordion"
        phases={phases}
        activeRate={activeRate}
        onEdit={onEdit}
        onRemove={jest.fn()}
      />,
    )

    await userEvent.click(screen.getByTestId('rate-phase-row-edit-0'))
    expect(onEdit).toHaveBeenCalledWith(0)
  })

  it('GIVEN the remove action THEN onRemove is called with the row index', async () => {
    const onRemove = jest.fn()

    render(
      <RatePhaseList
        variant="accordion"
        phases={phases}
        activeRate={activeRate}
        onEdit={jest.fn()}
        onRemove={onRemove}
      />,
    )

    await userEvent.click(screen.getByTestId('rate-phase-row-remove-0'))
    expect(onRemove).toHaveBeenCalledWith(0)
  })

  it('GIVEN a phase with an override that differs from the active rate THEN the differing field gets the overridden treatment', async () => {
    const overriddenPhase = {
      ...RATE_PHASE_FORM_DEFAULTS,
      code: 'phase-1',
      overrideEnabled: true,
      rateModel: RateCardRateModelEnum.Package,
    }

    render(
      <RatePhaseList
        variant="accordion"
        phases={[overriddenPhase]}
        activeRate={activeRate}
        onEdit={jest.fn()}
        onRemove={jest.fn()}
      />,
    )

    await userEvent.click(screen.getByText('phase-1'))
    expect(screen.getByTestId('rate-phase-field-rateModel')).toHaveClass('bg-purple-100')
  })
})

describe('RatePhaseList, linked variant', () => {
  it('renders as a stub without throwing', () => {
    render(<RatePhaseList variant="linked" phases={[]} getPhaseHref={() => '/x'} />)
  })
})
