import { usePermissions } from '~/hooks/usePermissions'

type AccordionPermissionDomain = 'plan' | 'charges'

type AccordionPermissions = {
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export const useAccordionPermissions = (
  isInSubscriptionForm: boolean,
  domain: AccordionPermissionDomain = 'plan',
): AccordionPermissions => {
  const { hasPermissions } = usePermissions()

  if (isInSubscriptionForm) {
    // Sub plan tab mirrors the subscription edit form: edit only, no add/delete.
    // BE requires subscriptions:update for the override mutations, for both plan
    // and charges sections (there is no subscription-level create/delete charge mutation).
    return {
      canCreate: false,
      canUpdate: hasPermissions(['subscriptionsUpdate']),
      canDelete: false,
    }
  }

  // Charges, fixed charges and their filters are enforced by the backend under
  // their own charges:* permission, distinct from plans:*.
  if (domain === 'charges') {
    return {
      canCreate: hasPermissions(['chargesCreate']),
      canUpdate: hasPermissions(['chargesUpdate']),
      canDelete: hasPermissions(['chargesDelete']),
    }
  }

  // Every 'plan' domain accordion submits through the single updatePlan mutation
  // (plans:update only) - no plans:create/delete exists for a plan sub-resource.
  const canUpdate = hasPermissions(['plansUpdate'])

  return {
    canCreate: canUpdate,
    canUpdate,
    canDelete: canUpdate,
  }
}
