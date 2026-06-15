import { useInternationalization } from '~/hooks/core/useInternationalization'
import Dashboard from '~/pages/dashboards/Dashboard'

const AnalyticsDashboard = () => {
  const { translate } = useInternationalization()

  return (
    <Dashboard
      contentTitle={translate('text_6553885df387fd0097fd7384')}
      dashboardTitle="Lago Dashboard"
      dashboardTitleTestKey="superset-dashboard-test-name-analytics"
    />
  )
}

export default AnalyticsDashboard
