import { usePermissions } from '~/hooks/usePermissions'

export const usePlanShouldShowActions = () => {
  const { hasPermissions } = usePermissions()

  return hasPermissions(['plansCreate', 'plansUpdate', 'plansDelete'])
}
