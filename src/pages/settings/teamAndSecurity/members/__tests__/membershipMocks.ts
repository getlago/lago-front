import { GetRolesListDocument } from '~/generated/graphql'

const allPermissionsGranted = {
  __typename: 'Permissions',
  addonsCreate: true,
  addonsDelete: true,
  addonsUpdate: true,
  addonsView: true,
  analyticsOverdueBalancesView: true,
  analyticsMrrView: true,
  analyticsInvoicedUsagesView: true,
  analyticsView: true,
  analyticsGrossRevenuesView: true,
  billableMetricsCreate: true,
  billableMetricsDelete: true,
  billableMetricsUpdate: true,
  billableMetricsView: true,
  billingEntitiesCreate: true,
  billingEntitiesDelete: true,
  billingEntitiesUpdate: true,
  billingEntitiesView: true,
  couponsAttach: true,
  couponsCreate: true,
  couponsDelete: true,
  couponsDetach: true,
  couponsUpdate: true,
  couponsView: true,
  creditNotesCreate: true,
  creditNotesUpdate: true,
  creditNotesView: true,
  creditNotesVoid: true,
  customerSettingsUpdateGracePeriod: true,
  customerSettingsUpdateLang: true,
  customerSettingsUpdatePaymentTerms: true,
  customerSettingsUpdateTaxRates: true,
  customersCreate: true,
  customersDelete: true,
  customersUpdate: true,
  customersView: true,
  developersKeysManage: true,
  developersManage: true,
  draftInvoicesUpdate: true,
  dunningCampaignsCreate: true,
  dunningCampaignsDelete: true,
  dunningCampaignsUpdate: true,
  dunningCampaignsView: true,
  invoiceCustomSectionsCreate: true,
  invoiceCustomSectionsDelete: true,
  invoiceCustomSectionsUpdate: true,
  invoiceCustomSectionsView: true,
  invoicesCreate: true,
  invoicesSend: true,
  invoicesUpdate: true,
  invoicesView: true,
  invoicesVoid: true,
  organizationEmailsUpdate: true,
  organizationEmailsView: true,
  organizationIntegrationsCreate: true,
  organizationIntegrationsDelete: true,
  organizationIntegrationsUpdate: true,
  organizationIntegrationsView: true,
  organizationInvoicesUpdate: true,
  organizationInvoicesView: true,
  organizationMembersCreate: true,
  organizationMembersDelete: true,
  organizationMembersUpdate: true,
  organizationMembersView: true,
  organizationTaxesUpdate: true,
  organizationTaxesView: true,
  organizationUpdate: true,
  organizationView: true,
  plansCreate: true,
  plansDelete: true,
  plansUpdate: true,
  plansView: true,
  rolesCreate: true,
  rolesDelete: true,
  rolesUpdate: true,
  rolesView: true,
  subscriptionsCreate: true,
  subscriptionsUpdate: true,
  subscriptionsView: true,
  walletsCreate: true,
  walletsTerminate: true,
  walletsTopUp: true,
  walletsUpdate: true,
}

export const createMockMembership = (id: string, email: string, roles: string[]) => ({
  __typename: 'Membership',
  id,
  roles,
  user: {
    __typename: 'User',
    id: `user-${id}`,
    email,
  },
  organization: {
    __typename: 'Organization',
    id: 'org-1',
    name: 'Test Organization',
  },
  permissions: allPermissionsGranted,
})

export const mockMembers = [
  createMockMembership('member-1', 'admin@example.com', ['Admin']),
  createMockMembership('member-2', 'finance@example.com', ['Finance']),
]

type MembershipsResultOptions = {
  collection?: ReturnType<typeof createMockMembership>[]
  totalCount?: number
  totalPages?: number
  adminCount?: number
}

export const buildMembershipsResult = ({
  collection = mockMembers,
  totalCount = collection.length,
  totalPages = 1,
  adminCount = 1,
}: MembershipsResultOptions = {}) => ({
  data: {
    memberships: {
      __typename: 'MembershipCollection',
      metadata: {
        __typename: 'MembershipsCollectionMetadata',
        currentPage: 1,
        totalPages,
        totalCount,
        adminCount,
      },
      collection,
    },
  },
})

export const ADMIN_ROLE_ID = 'role-1'
export const FINANCE_ROLE_ID = 'role-2'

export const rolesListMock = {
  request: {
    query: GetRolesListDocument,
  },
  result: {
    data: {
      roles: [
        {
          __typename: 'Role',
          id: ADMIN_ROLE_ID,
          name: 'Admin',
          code: 'admin',
          description: 'Administrator role',
          permissions: [],
          admin: true,
          memberships: [],
        },
        {
          __typename: 'Role',
          id: FINANCE_ROLE_ID,
          name: 'Finance',
          code: 'finance',
          description: 'Finance role',
          permissions: [],
          admin: false,
          memberships: [],
        },
      ],
    },
  },
}
