import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CatalogPlanOverviewSectionsEnum } from '~/core/constants/tabsOptions'
import { CurrencyEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { CatalogPlanDetailsOverview } from '../CatalogPlanDetailsOverview'

const mockParams = { catalogPlanId: 'plan-1', section: undefined as string | undefined }
const mockNavigate = jest.fn()
const mockOpenAppliedRateCardDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => mockParams,
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/components/appliedRateCards/drawers/appliedRateCard/useAppliedRateCardDrawer', () => ({
  useAppliedRateCardDrawer: () => ({ openDrawer: mockOpenAppliedRateCardDrawer }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

// Captures the prop passed down instead of rendering the real section, so the
// test can trigger it directly rather than reaching through its own markup.
jest.mock('../CatalogPlanOverviewSection', () => ({
  CatalogPlanOverviewSection: ({ onAssignRateCard }: { onAssignRateCard?: () => void }) => (
    <div data-test="plan-overview-section">
      {onAssignRateCard && (
        <button data-test="assign-rate-card" onClick={onAssignRateCard}>
          assign
        </button>
      )}
    </div>
  ),
}))

// The section makes a real GraphQL query; its own data/empty/error behavior is
// covered by CatalogPlanRateCardsSection.test.tsx, this file only cares which
// section renders.
jest.mock('../CatalogPlanRateCardsSection', () => ({
  CatalogPlanRateCardsSection: () => <div data-test="rate-cards-section" />,
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

type OverviewOverrides = {
  currency?: CurrencyEnum | null
  isRateCardsLocked?: boolean
}

const renderOverview = ({
  currency = CurrencyEnum.Usd,
  isRateCardsLocked = false,
}: OverviewOverrides = {}): void => {
  render(
    <CatalogPlanDetailsOverview
      // `null` (not a plain optional default) models "no currency yet" explicitly.
      currency={currency ?? undefined}
      isRateCardsLocked={isRateCardsLocked}
      rateCardsCount={0}
    />,
    {
      wrapper: AllTheProviders,
    },
  )
}

describe('CatalogPlanDetailsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

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
    expect(screen.getByTestId('rate-cards-section')).toBeInTheDocument()
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
    render(
      <CatalogPlanDetailsOverview
        currency={CurrencyEnum.Usd}
        isRateCardsLocked={false}
        rateCardsCount={4}
        loading
      />,
      {
        wrapper: AllTheProviders,
      },
    )

    expect(screen.getByTestId('nav')).toHaveAttribute('data-rate-cards-count', '4')
    expect(screen.getByTestId('nav')).toHaveAttribute('data-loading', 'true')
  })

  it('GIVEN permission, unlocked plan and a currency THEN a click on assign rate card navigates and opens the drawer', async () => {
    mockParams.section = undefined
    renderOverview()

    await userEvent.click(screen.getByTestId('assign-rate-card'))

    expect(mockNavigate).toHaveBeenCalledWith('/plan-pricing/plan-1/overview/rate-cards')
    expect(mockOpenAppliedRateCardDrawer).toHaveBeenCalledWith({
      context: 'plan',
      planId: 'plan-1',
      currency: CurrencyEnum.Usd,
    })
  })

  it('GIVEN no update permission THEN does not offer the assign rate card callback', () => {
    mockHasPermissions.mockReturnValue(false)
    mockParams.section = undefined
    renderOverview()

    expect(screen.queryByTestId('assign-rate-card')).not.toBeInTheDocument()
  })

  it('GIVEN the plan locked (attached to contracts) THEN does not offer the assign rate card callback', () => {
    mockParams.section = undefined
    renderOverview({ isRateCardsLocked: true })

    expect(screen.queryByTestId('assign-rate-card')).not.toBeInTheDocument()
  })

  it('GIVEN no currency yet THEN does not offer the assign rate card callback', () => {
    mockParams.section = undefined
    renderOverview({ currency: null })

    expect(screen.queryByTestId('assign-rate-card')).not.toBeInTheDocument()
  })
})
