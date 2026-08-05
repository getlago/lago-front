import { render } from '~/test-utils'

import AnalyticsDashboard from '../AnalyticsDashboard'
import { type DashboardProps } from '../Dashboard'

// Stub the Superset-backed child; assert the wrapper hands it the analytics config.
const mockDashboard = jest.fn()

jest.mock('~/pages/dashboards/Dashboard', () => ({
  __esModule: true,
  default: (props: DashboardProps) => {
    mockDashboard(props)
    return <div data-test="dashboard-stub" />
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the Lago Dashboard with the analytics-scoped test key', () => {
    render(<AnalyticsDashboard />)

    expect(mockDashboard).toHaveBeenCalledTimes(1)
    expect(mockDashboard).toHaveBeenCalledWith(
      expect.objectContaining({
        dashboardTitle: 'Lago Dashboard',
        dashboardTitleTestKey: 'superset-dashboard-test-name-analytics',
      }),
    )
  })
})
