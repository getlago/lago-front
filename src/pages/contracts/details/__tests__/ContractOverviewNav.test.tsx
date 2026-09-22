import { render, screen, within } from '@testing-library/react'

import { ContractOverviewSectionsEnum } from '~/core/constants/tabsOptions'
import { AllTheProviders } from '~/test-utils'

import { CONTRACT_OVERVIEW_NAV_TEST_ID, ContractOverviewNav } from '../ContractOverviewNav'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const renderNav = ({
  activeSection = ContractOverviewSectionsEnum.contractOverview,
  rateCardsCount = 0,
  loading = false,
}: {
  activeSection?: ContractOverviewSectionsEnum
  rateCardsCount?: number
  loading?: boolean
} = {}) =>
  render(
    <ContractOverviewNav
      contractId="contract-1"
      activeSection={activeSection}
      rateCardsCount={rateCardsCount}
      loading={loading}
    />,
    { wrapper: AllTheProviders },
  )

describe('ContractOverviewNav', () => {
  it('links the overview and nested rate-card sections', () => {
    renderNav({ rateCardsCount: 4 })

    expect(screen.getByRole('link', { name: /text_17897233021145awow0e13vf/ })).toHaveAttribute(
      'href',
      '/contracts/contract-1/overview',
    )
    expect(screen.getByRole('link', { name: /text_1783104239825nxqno33u945/ })).toHaveAttribute(
      'href',
      '/contracts/contract-1/overview/rate-cards',
    )
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows a count skeleton without a stale zero while loading', () => {
    renderNav({ rateCardsCount: undefined, loading: true })

    const nav = within(screen.getByTestId(CONTRACT_OVERVIEW_NAV_TEST_ID))
    const overviewLink = nav.getByRole('link', { name: /text_17897233021145awow0e13vf/ })
    const rateCardsLink = nav.getByRole('link', { name: /text_1783104239825nxqno33u945/ })

    expect(overviewLink.querySelector('.animate-pulse')).not.toBeInTheDocument()
    expect(rateCardsLink.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
