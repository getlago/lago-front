import { useEffect } from 'react'
import { useParams } from 'react-router'

import { addToast, envGlobalVar } from '~/core/apolloClient'
import { useLocation } from '~/core/router'
import { activateBillingAccount } from '~/core/utils/billingAccounts'
import { OrganizationActivationStatusEnum, OrganizationEnvironmentEnum } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'

// Module scope, not a ref: OrganizationLayout remounts on routes outside it, and Activate runs once per app load.
const attemptedOrganizationIds = new Set<string>()

export const markProductionActivationAttempted = (organizationId: string): void => {
  attemptedOrganizationIds.add(organizationId)
}

export const useActivatePendingProductionOrganizations = (): void => {
  const { organizationSlug } = useParams<{ organizationSlug: string }>()
  const { state } = useLocation<{ startCheckout?: boolean } | null>()
  const { currentUser, refetchCurrentUserInfos } = useCurrentUser()
  const isStartingCheckout = !!state?.startCheckout

  useEffect(() => {
    if (!currentUser || !envGlobalVar().billingAccountsUrl) return

    currentUser.memberships.forEach(({ organization }) => {
      const isPendingProduction =
        organization.accessibleByCurrentSession &&
        organization.environment === OrganizationEnvironmentEnum.Production &&
        organization.activationStatus === OrganizationActivationStatusEnum.PendingPaymentMethod

      if (!isPendingProduction || attemptedOrganizationIds.has(organization.id)) return

      markProductionActivationAttempted(organization.id)

      // PendingOrganizationShell is calling Start for this organization and leaves for Stripe.
      if (isStartingCheckout && organization.slug === organizationSlug) return

      activateBillingAccount(organization.id).then(
        async ({ isActive }) => {
          if (!isActive) return

          await refetchCurrentUserInfos().catch(() => undefined)
          addToast({ severity: 'success', translateKey: 'text_1795423996044mbp29b5w9nn' })
        },
        () => undefined,
      )
    })
  }, [currentUser, isStartingCheckout, organizationSlug, refetchCurrentUserInfos])
}
