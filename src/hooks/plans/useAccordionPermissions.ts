import { usePermissions } from '~/hooks/usePermissions'

type AccordionPermissionDomain = 'plan' | 'charges'

export const useAccordionPermissions = (
  isInSubscriptionForm: boolean,
  domain: AccordionPermissionDomain = 'plan',
) => {
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

  return {
    canCreate: hasPermissions(['plansCreate']),
    canUpdate: hasPermissions(['plansUpdate']),
    canDelete: hasPermissions(['plansDelete']),
  }
}
