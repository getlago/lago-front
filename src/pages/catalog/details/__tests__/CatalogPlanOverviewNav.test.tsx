import { render, screen } from '@testing-library/react'

import { CatalogPlanOverviewSectionsEnum } from '~/core/constants/tabsOptions'
import { AllTheProviders } from '~/test-utils'

import { CatalogPlanOverviewNav } from '../CatalogPlanOverviewNav'

type Props = {
  activeSection?: CatalogPlanOverviewSectionsEnum
  rateCardsCount?: number
  loading?: boolean
}

const renderNav = ({
  activeSection = CatalogPlanOverviewSectionsEnum.planOverview,
  rateCardsCount = 0,
  loading = false,
}: Props = {}): void => {
  render(
    <CatalogPlanOverviewNav
      catalogPlanId="plan-1"
      activeSection={activeSection}
      rateCardsCount={rateCardsCount}
      loading={loading}
    />,
    { wrapper: AllTheProviders },
  )
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const PLAN_OVERVIEW_LABEL = 'text_1789030049529z30uq3e7z48'
const RATE_CARDS_LABEL = 'text_1783104239825nxqno33u945'

describe('CatalogPlanOverviewNav', () => {
  it('GIVEN the nav THEN lists both sections', () => {
    renderNav()

    expect(screen.getByText(PLAN_OVERVIEW_LABEL)).toBeInTheDocument()
    expect(screen.getByText(RATE_CARDS_LABEL)).toBeInTheDocument()
  })

  it('GIVEN a rate card count THEN renders it beside the rate cards item', () => {
    renderNav({ rateCardsCount: 4 })

    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('GIVEN the plan overview section THEN links it to the bare overview path', () => {
    renderNav()

    expect(screen.getByRole('link', { name: new RegExp(PLAN_OVERVIEW_LABEL) })).toHaveAttribute(
      'href',
      '/plan-pricing/plan-1/overview',
    )
  })

  it('GIVEN the rate cards section THEN links it to the section path', () => {
    renderNav()

    expect(screen.getByRole('link', { name: new RegExp(RATE_CARDS_LABEL) })).toHaveAttribute(
      'href',
      '/plan-pricing/plan-1/overview/rate-cards',
    )
  })

  it('GIVEN an active section THEN marks only that link current', () => {
    renderNav({ activeSection: CatalogPlanOverviewSectionsEnum.rateCards })

    expect(screen.getByRole('link', { name: new RegExp(RATE_CARDS_LABEL) })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: new RegExp(PLAN_OVERVIEW_LABEL) })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('GIVEN loading THEN hides the count rather than showing a stale zero', () => {
    renderNav({ rateCardsCount: undefined, loading: true })

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
