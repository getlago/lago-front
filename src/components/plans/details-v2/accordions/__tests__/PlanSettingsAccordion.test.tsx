import { screen } from '@testing-library/react'

import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { planDetailsV2Fixture } from '../../__tests__/fixtures'
import { PlanSettingsAccordion } from '../PlanSettingsAccordion'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('PlanSettingsAccordion', () => {
  it('renders the shared PlanSettingsInfo content', () => {
    render(<PlanSettingsAccordion plan={planDetailsV2Fixture} />)

    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('pro')).toBeInTheDocument()
    expect(screen.getByText(CurrencyEnum.Usd)).toBeInTheDocument()
  })
})
