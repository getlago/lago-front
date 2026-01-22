import { gql } from '@apollo/client'

import { Permissions } from '~/generated/graphql'

import { useCurrentUser } from './useCurrentUser'

gql`
  fragment MembershipPermissions on Membership {
    id
    permissions {
      aiConversationsView
      aiConversationsCreate
      addonsCreate
      addonsDelete
      addonsUpdate
      addonsView
      analyticsView
      analyticsOverdueBalancesView
      auditLogsView
      authenticationMethodsView
      authenticationMethodsUpdate
      billableMetricsCreate
      billableMetricsDelete
      billableMetricsUpdate
      billableMetricsView
      billingEntitiesView
      billingEntitiesCreate
      billingEntitiesUpdate
      billingEntitiesDelete
      billingEntitiesInvoicesView
      billingEntitiesInvoicesUpdate
      billingEntitiesTaxesView
      billingEntitiesTaxesUpdate
      billingEntitiesEmailsView
      billingEntitiesEmailsUpdate
      billingEntitiesDunningCampaignsUpdate
      couponsAttach
      couponsCreate
      couponsDelete
      couponsDetach
      couponsUpdate
      couponsView
      creditNotesCreate
      creditNotesView
      creditNotesVoid
      customersCreate
      customersDelete
      customersUpdate
      customersView
      dataApiView
      developersKeysManage
      developersManage
      draftInvoicesUpdate
      dunningCampaignsCreate
      dunningCampaignsUpdate
      dunningCampaignsView
      featuresCreate
      featuresDelete
      featuresUpdate
      featuresView
      invoiceCustomSectionsCreate
      invoiceCustomSectionsUpdate
      invoicesCreate
      invoicesSend
      invoicesUpdate
      invoicesView
      invoicesVoid
      organizationEmailsUpdate
      organizationEmailsView
      organizationIntegrationsCreate
      organizationIntegrationsDelete
      organizationIntegrationsUpdate
      organizationIntegrationsView
      organizationInvoicesUpdate
      organizationInvoicesView
      organizationMembersCreate
      organizationMembersDelete
      organizationMembersUpdate
      organizationMembersView
      organizationTaxesUpdate
      organizationTaxesView
      organizationUpdate
      organizationView
      paymentsCreate
      paymentsView
      plansCreate
      plansDelete
      plansUpdate
      plansView
      pricingUnitsCreate
      pricingUnitsUpdate
      pricingUnitsView
      rolesCreate
      rolesDelete
      rolesUpdate
      rolesView
      permissionsView
      subscriptionsCreate
      subscriptionsUpdate
      subscriptionsView
      walletsCreate
      walletsTerminate
      walletsTopUp
      walletsUpdate
    }
  }
`
export type TMembershipPermissions = Omit<Permissions, '__typename'>

type TUsePermissionsProps = () => {
  hasPermissions: (permissionsToCheck: Array<keyof TMembershipPermissions>) => boolean
  findFirstViewPermission: () => keyof TMembershipPermissions | null
}

export const usePermissions: TUsePermissionsProps = () => {
  const { currentMembership } = useCurrentUser()

  const hasPermissions = (permissionsToCheck: Array<keyof TMembershipPermissions>): boolean => {
    if (!currentMembership) return false

    const allPermissions = currentMembership.permissions as TMembershipPermissions

    const permissionsFound =
      permissionsToCheck.map((permission) => allPermissions[permission]) || []

    return permissionsFound.every((permission) => !!permission && permission === true)
  }

  const findFirstViewPermission = (): keyof TMembershipPermissions | null => {
    if (!currentMembership) return null

    const allPermissions = currentMembership.permissions as TMembershipPermissions

    const viewPermissionsKeys = Object.keys(allPermissions).filter((key) =>
      key.toLowerCase().includes('view'),
    ) as Array<keyof TMembershipPermissions>

    return viewPermissionsKeys.find((key) => allPermissions[key]) ?? null
  }

  return {
    hasPermissions,
    findFirstViewPermission,
  }
}
