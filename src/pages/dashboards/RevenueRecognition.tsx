import { useInternationalization } from '~/hooks/core/useInternationalization'
import Dashboard from '~/pages/dashboards/Dashboard'

const RevenueRecognitionDashboard = () => {
  const { translate } = useInternationalization()

  return (
    <Dashboard
      contentTitle={translate('text_1780667013874s6wl9cmxe7q')}
      dashboardTitle="Revenue Recognition"
      dashboardTitleTestKey="superset-dashboard-test-name-revenue-recognition"
    />
  )
}

export default RevenueRecognitionDashboard
