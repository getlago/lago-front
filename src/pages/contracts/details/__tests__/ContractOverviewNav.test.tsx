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
  isAlertsEnabled = false,
  alertsCount,
  alertsCountLoading = false,
}: {
  activeSection?: ContractOverviewSectionsEnum
  rateCardsCount?: number
  loading?: boolean
  isAlertsEnabled?: boolean
  alertsCount?: number
  alertsCountLoading?: boolean
} = {}) =>
  render(
    <ContractOverviewNav
      contractId="contract-1"
      activeSection={activeSection}
      rateCardsCount={rateCardsCount}
      loading={loading}
      isAlertsEnabled={isAlertsEnabled}
      alertsCount={alertsCount}
      alertsCountLoading={alertsCountLoading}
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

  describe('GIVEN the alerts feature flag', () => {
    describe('WHEN it is enabled', () => {
      it('THEN should link the alerts section as the third item', () => {
        renderNav({ isAlertsEnabled: true })

        const links = screen.getAllByRole('link')

        expect(links).toHaveLength(3)
        expect(links[2]).toHaveAttribute('href', '/contracts/contract-1/overview/alerts')
      })
    })

    describe('WHEN it is disabled', () => {
      it('THEN should not render the alerts link', () => {
        renderNav({ isAlertsEnabled: false })

        const links = screen.getAllByRole('link')

        expect(links).toHaveLength(2)
        links.forEach((link) => expect(link.getAttribute('href')).not.toMatch(/\/alerts$/))
      })
    })
  })

  describe('GIVEN the alerts count', () => {
    describe('WHEN it is loaded', () => {
      it('THEN should show it next to alerts while rate cards keep their own count', () => {
        renderNav({ isAlertsEnabled: true, alertsCount: 7, rateCardsCount: 3 })

        const links = screen.getAllByRole('link')

        expect(within(links[2]).getByText('7')).toBeInTheDocument()
        expect(within(links[1]).getByText('3')).toBeInTheDocument()
      })
    })

    describe('WHEN it is loading', () => {
      it('THEN should show a skeleton on the alerts link only', () => {
        renderNav({ isAlertsEnabled: true, alertsCount: 7, alertsCountLoading: true })

        const links = screen.getAllByRole('link')

        expect(links[2].querySelector('.animate-pulse')).toBeInTheDocument()
        expect(within(links[2]).queryByText('7')).not.toBeInTheDocument()
        expect(links[1].querySelector('.animate-pulse')).not.toBeInTheDocument()
      })
    })
  })
})
