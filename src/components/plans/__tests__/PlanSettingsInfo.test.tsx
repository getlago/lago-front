import { screen } from '@testing-library/react'

import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { render } from '~/test-utils'

import { PlanSettingsInfo } from '../PlanSettingsInfo'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const basePlan = {
  __typename: 'Plan' as const,
  name: 'Pro',
  code: 'pro',
  description: null,
  interval: PlanInterval.Monthly,
  amountCurrency: CurrencyEnum.Usd,
}

describe('PlanSettingsInfo', () => {
  it('renders name, code, interval and currency', () => {
    render(<PlanSettingsInfo plan={basePlan} />)

    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('pro')).toBeInTheDocument()
    expect(screen.getByText(CurrencyEnum.Usd)).toBeInTheDocument()
  })

  it('omits the description row when description is empty', () => {
    render(<PlanSettingsInfo plan={basePlan} />)

    expect(screen.queryByText('text_6388b923e514213fed58331c')).not.toBeInTheDocument()
  })

  it('renders the description row when description is non-empty', () => {
    render(<PlanSettingsInfo plan={{ ...basePlan, description: 'A pro plan' }} />)

    expect(screen.getByText('text_6388b923e514213fed58331c')).toBeInTheDocument()
    expect(screen.getByText('A pro plan')).toBeInTheDocument()
  })
})
