import { screen } from '@testing-library/react'

import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { type DashboardProps } from '../Dashboard'
import RevenueRecognitionDashboard from '../RevenueRecognition'

// The wrapper only decides access + which props to hand the embedded dashboard.
// Stub the heavy Superset-backed child so we assert the wrapper's own logic.
const mockDashboard = jest.fn()
const mockHasOrganizationPremiumAddon = jest.fn()

jest.mock('~/pages/dashboards/Dashboard', () => ({
  __esModule: true,
  default: (props: DashboardProps) => {
    mockDashboard(props)
    return <div data-test="dashboard-stub" />
  },
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasOrganizationPremiumAddon: (...args: unknown[]) => mockHasOrganizationPremiumAddon(...args),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/components/premium/PremiumFeature', () => ({
  __esModule: true,
  default: (props: { title: string }) => <div data-test="premium-feature-stub">{props.title}</div>,
}))

describe('RevenueRecognitionDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the org lacks the RevenueRecognition premium addon', () => {
    it('THEN renders the premium upsell and does not embed the dashboard', () => {
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      render(<RevenueRecognitionDashboard />)

      expect(screen.getByTestId('premium-feature-stub')).toBeInTheDocument()
      expect(mockDashboard).not.toHaveBeenCalled()
      expect(mockHasOrganizationPremiumAddon).toHaveBeenCalledWith(
        PremiumIntegrationTypeEnum.RevenueRecognition,
      )
    })
  })

  describe('GIVEN the org has the RevenueRecognition premium addon', () => {
    it('THEN renders the Revenue Recognition dashboard with its scoped test key', () => {
      mockHasOrganizationPremiumAddon.mockReturnValue(true)

      render(<RevenueRecognitionDashboard />)

      expect(screen.queryByTestId('premium-feature-stub')).not.toBeInTheDocument()
      expect(mockDashboard).toHaveBeenCalledTimes(1)
      expect(mockDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          dashboardTitle: 'Revenue Recognition',
          dashboardTitleTestKey: 'superset-dashboard-test-name-revenue-recognition',
        }),
      )
    })
  })
})
