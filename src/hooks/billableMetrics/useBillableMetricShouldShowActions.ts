import { usePermissions } from '~/hooks/usePermissions'

export const useBillableMetricShouldShowActions = () => {
  const { hasPermissions } = usePermissions()

  return hasPermissions(['billableMetricsCreate', 'billableMetricsUpdate', 'billableMetricsDelete'])
}
