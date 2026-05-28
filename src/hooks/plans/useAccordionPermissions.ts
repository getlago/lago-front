import { usePermissions } from '~/hooks/usePermissions'

export const useAccordionPermissions = (isInSubscriptionForm: boolean) => {
  const { hasPermissions } = usePermissions()
  const editable = !isInSubscriptionForm

  return {
    canCreate: hasPermissions(['plansCreate']) && editable,
    canUpdate: hasPermissions(['plansUpdate']) && editable,
    canDelete: hasPermissions(['plansDelete']) && editable,
  }
}
