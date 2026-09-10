import { render, screen } from '@testing-library/react'

import { CatalogPlanOverviewSectionsEnum } from '~/core/constants/tabsOptions'
import { AllTheProviders } from '~/test-utils'

import { CatalogPlanDetailsOverview } from '../CatalogPlanDetailsOverview'

const mockParams = { catalogPlanId: 'plan-1', section: undefined as string | undefined }

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('../CatalogPlanOverviewSection', () => ({
  CatalogPlanOverviewSection: () => <div data-test="plan-overview-section" />,
}))

jest.mock('../CatalogPlanOverviewNav', () => ({
  CatalogPlanOverviewNav: ({ activeSection }: { activeSection: string }) => (
    <div data-test="nav" data-active={activeSection} />
  ),
}))

const RATE_CARDS_EMPTY_KEY = 'text_1789030049529u2gzzho6x8x'

const renderOverview = (): void => {
  render(<CatalogPlanDetailsOverview rateCardsCount={0} />, { wrapper: AllTheProviders })
}

describe('CatalogPlanDetailsOverview', () => {
  it('GIVEN no section param THEN renders the plan overview section', () => {
    mockParams.section = undefined
    renderOverview()

    expect(screen.getByTestId('plan-overview-section')).toBeInTheDocument()
    expect(screen.getByTestId('nav')).toHaveAttribute('data-active', 'plan-overview')
  })

  it('GIVEN the plan-overview section THEN renders the plan overview section', () => {
    mockParams.section = CatalogPlanOverviewSectionsEnum.planOverview
    renderOverview()

    expect(screen.getByTestId('plan-overview-section')).toBeInTheDocument()
  })

  it('GIVEN the rate-cards section THEN renders the rate cards section instead', () => {
    mockParams.section = CatalogPlanOverviewSectionsEnum.rateCards
    renderOverview()

    expect(screen.queryByTestId('plan-overview-section')).not.toBeInTheDocument()
    expect(screen.getByText(RATE_CARDS_EMPTY_KEY)).toBeInTheDocument()
    expect(screen.getByTestId('nav')).toHaveAttribute('data-active', 'rate-cards')
  })

  it('GIVEN an unknown section THEN falls back to the plan overview section', () => {
    mockParams.section = 'not-a-section'
    renderOverview()

    expect(screen.getByTestId('plan-overview-section')).toBeInTheDocument()
    expect(screen.getByTestId('nav')).toHaveAttribute('data-active', 'plan-overview')
  })
})
