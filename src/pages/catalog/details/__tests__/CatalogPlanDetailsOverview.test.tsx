import { render, screen } from '@testing-library/react'

import { CatalogPlanOverviewSectionsEnum } from '~/core/constants/tabsOptions'
import { AllTheProviders } from '~/test-utils'

import { CatalogPlanDetailsOverview } from '../CatalogPlanDetailsOverview'
import { CATALOG_PLAN_ADD_RATE_CARD_TEST_ID } from '../CatalogPlanRateCardsSection'

const mockParams = { catalogPlanId: 'plan-1', section: undefined as string | undefined }

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => mockParams,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('../CatalogPlanOverviewSection', () => ({
  CatalogPlanOverviewSection: () => <div data-test="plan-overview-section" />,
}))

jest.mock('../CatalogPlanOverviewNav', () => ({
  CatalogPlanOverviewNav: ({
    activeSection,
    rateCardsCount,
    loading,
  }: {
    activeSection: string
    rateCardsCount?: number
    loading?: boolean
  }) => (
    <div
      data-test="nav"
      data-active={activeSection}
      data-rate-cards-count={rateCardsCount}
      data-loading={String(loading)}
    />
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
    expect(screen.getByTestId(CATALOG_PLAN_ADD_RATE_CARD_TEST_ID)).toBeInTheDocument()
    expect(screen.getByTestId('nav')).toHaveAttribute('data-active', 'rate-cards')
  })

  it('GIVEN an unknown section THEN falls back to the plan overview section', () => {
    mockParams.section = 'not-a-section'
    renderOverview()

    expect(screen.getByTestId('plan-overview-section')).toBeInTheDocument()
    expect(screen.getByTestId('nav')).toHaveAttribute('data-active', 'plan-overview')
  })

  it('GIVEN rateCardsCount and loading THEN forwards both to the nav', () => {
    mockParams.section = undefined
    render(<CatalogPlanDetailsOverview rateCardsCount={4} loading />, {
      wrapper: AllTheProviders,
    })

    expect(screen.getByTestId('nav')).toHaveAttribute('data-rate-cards-count', '4')
    expect(screen.getByTestId('nav')).toHaveAttribute('data-loading', 'true')
  })
})
