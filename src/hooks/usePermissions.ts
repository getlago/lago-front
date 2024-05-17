import { gql } from '@apollo/client'

import { Permissions } from '~/generated/graphql'

import { useCurrentUser } from './useCurrentUser'

gql`
  fragment MembershipPermissions on Membership {
    id
    permissions {
      addonsCreate
      addonsDelete
      addonsUpdate
      addonsView
      analyticsView
      billableMetricsCreate
      billableMetricsDelete
      billableMetricsUpdate
      billableMetricsView
      couponsAttach
      couponsCreate
      couponsDelete
      couponsDetach
      couponsUpdate
      couponsView
      creditNotesCreate
      creditNotesUpdate
      creditNotesView
      creditNotesVoid
      customerSettingsUpdateGracePeriod
      customerSettingsUpdateLang
      customerSettingsUpdatePaymentTerms
      customerSettingsUpdateTaxRates
      customerSettingsView
      customersCreate
      customersDelete
      customersUpdate
      customersView
      developersKeysManage
      developersManage
      draftInvoicesUpdate
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
      plansCreate
      plansDelete
      plansUpdate
      plansView
      subscriptionsCreate
      subscriptionsDelete
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
}

export const usePermissions: TUsePermissionsProps = () => {
  const { currentMembership } = useCurrentUser()

  const hasPermissions = (permissionsToCheck?: Array<keyof TMembershipPermissions>): boolean => {
    const allPermissions = currentMembership?.permissions as TMembershipPermissions

    const permissionsFound =
      permissionsToCheck?.map((permission) => allPermissions[permission]) || []

    return permissionsFound.every((permission) => !!permission && permission === true)
  }

  return {
    hasPermissions,
  }
}
