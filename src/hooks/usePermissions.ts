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
      contractsCreate
      contractsTerminate
      contractsUpdate
      contractsView
      couponsAttach
      couponsCreate
      couponsDelete
      couponsDetach
      couponsUpdate
      couponsView
      creditNotesCreate
      creditNotesView
      creditNotesVoid
      creditNotesSend
      customersCreate
      customersDelete
      customersUpdate
      customersView
      dataApiView
      developersKeysManage
      developersManage
      dunningCampaignsCreate
      dunningCampaignsDelete
      dunningCampaignsUpdate
      dunningCampaignsView
      featuresCreate
      featuresDelete
      featuresUpdate
      featuresView
      invoiceCustomSectionsCreate
      invoiceCustomSectionsUpdate
      invoicesCreate
      invoicesDelete
      invoicesSend
      invoicesUpdate
      invoicesView
      invoicesVoid
      invoicesSend
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
      paymentReceiptsView
      paymentReceiptsSend
      plansCreate
      plansDelete
      plansUpdate
      plansView
      quotesApprove
      quotesClone
      quotesCreate
      quotesUpdate
      quotesView
      quotesVoid
      orderFormsSign
      orderFormsView
      orderFormsVoid
      ordersExecute
      ordersUpdate
      ordersView
      pricingUnitsCreate
      pricingUnitsUpdate
      pricingUnitsView
      productsView
      productsCreate
      productsUpdate
      productsDelete
      rateCardsView
      rateCardsCreate
      rateCardsUpdate
      rateCardsDelete
      rolesCreate
      rolesDelete
      rolesUpdate
      rolesView
      securityLogsView
      subscriptionsCreate
      subscriptionsUpdate
      subscriptionsView
      usageAttributionTypesView
      usageAttributionTypesCreate
      usageAttributionTypesUpdate
      usageAttributionTypesDelete
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
  hasPermissionsOr: (permissionsToCheck: Array<keyof TMembershipPermissions>) => boolean
  findViewPermissions: () => Array<keyof TMembershipPermissions>
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

  const hasPermissionsOr = (permissionsToCheck: Array<keyof TMembershipPermissions>): boolean => {
    if (!currentMembership) return false

    // Empty array should return false for OR logic (nothing to check)
    if (permissionsToCheck.length === 0) return false

    const allPermissions = currentMembership.permissions as TMembershipPermissions
    const permissionsFound =
      permissionsToCheck.map((permission) => allPermissions[permission]) || []

    // At least ONE must be true (using .some() instead of .every())
    return permissionsFound.some((permission) => !!permission && permission === true)
  }

  const findViewPermissions = (): Array<keyof TMembershipPermissions> => {
    if (!currentMembership) return []

    const allPermissions = currentMembership.permissions as TMembershipPermissions

    const viewPermissionsKeys = Object.keys(allPermissions).filter((key) =>
      key.toLowerCase().includes('view'),
    ) as Array<keyof TMembershipPermissions>

    return viewPermissionsKeys.filter((key) => allPermissions[key])
  }

  return {
    hasPermissions,
    hasPermissionsOr,
    findViewPermissions,
  }
}
