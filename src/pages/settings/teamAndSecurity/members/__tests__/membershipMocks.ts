import { GetRolesListDocument, MembershipPermissionsFragment } from '~/generated/graphql'

export const allPermissionsGranted: MembershipPermissionsFragment['permissions'] = {
  __typename: 'Permissions',
  aiConversationsView: true,
  aiConversationsCreate: true,
  addonsCreate: true,
  addonsDelete: true,
  addonsUpdate: true,
  addonsView: true,
  analyticsView: true,
  auditLogsView: true,
  authenticationMethodsView: true,
  authenticationMethodsUpdate: true,
  billableMetricsCreate: true,
  billableMetricsDelete: true,
  billableMetricsUpdate: true,
  billableMetricsView: true,
  billingEntitiesView: true,
  billingEntitiesCreate: true,
  billingEntitiesUpdate: true,
  billingEntitiesDelete: true,
  couponsAttach: true,
  couponsCreate: true,
  couponsDelete: true,
  couponsDetach: true,
  couponsUpdate: true,
  couponsView: true,
  creditNotesCreate: true,
  creditNotesView: true,
  creditNotesVoid: true,
  creditNotesSend: true,
  customersCreate: true,
  customersDelete: true,
  customersUpdate: true,
  customersView: true,
  dataApiView: true,
  developersKeysManage: true,
  developersManage: true,
  dunningCampaignsCreate: true,
  dunningCampaignsDelete: true,
  dunningCampaignsUpdate: true,
  dunningCampaignsView: true,
  featuresCreate: true,
  featuresDelete: true,
  featuresUpdate: true,
  featuresView: true,
  invoiceCustomSectionsCreate: true,
  invoiceCustomSectionsUpdate: true,
  invoicesCreate: true,
  invoicesDelete: true,
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
  paymentsCreate: true,
  paymentsView: true,
  paymentReceiptsView: true,
  paymentReceiptsSend: true,
  plansCreate: true,
  plansDelete: true,
  plansUpdate: true,
  plansView: true,
  quotesApprove: true,
  quotesClone: true,
  quotesCreate: true,
  quotesUpdate: true,
  quotesView: true,
  quotesVoid: true,
  orderFormsSign: true,
  orderFormsView: true,
  orderFormsVoid: true,
  ordersExecute: true,
  ordersUpdate: true,
  ordersView: true,
  pricingUnitsCreate: true,
  pricingUnitsUpdate: true,
  pricingUnitsView: true,
  productCategoriesView: true,
  productCategoriesCreate: true,
  productCategoriesUpdate: true,
  productCategoriesDelete: true,
  productsView: true,
  productsCreate: true,
  productsUpdate: true,
  productsDelete: true,
  productFiltersView: true,
  productFiltersCreate: true,
  productFiltersUpdate: true,
  productFiltersDelete: true,
  rateCardsView: true,
  rateCardsCreate: true,
  rateCardsUpdate: true,
  rateCardsDelete: true,
  rolesCreate: true,
  rolesDelete: true,
  rolesUpdate: true,
  rolesView: true,
  securityLogsView: true,
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

export const createMockInvite = (id: string, email: string, roleCodes: string[]) => ({
  __typename: 'Invite',
  id,
  email,
  token: `token-${id}`,
  roles: roleCodes,
  organization: {
    __typename: 'Organization',
    id: 'org-1',
    name: 'Test Organization',
  },
})

// Invites store role CODES, not names — the API resolves the filtered role ids to codes
export const mockInvitations = [
  createMockInvite('invite-1', 'test1@example.com', ['admin']),
  createMockInvite('invite-2', 'test2@example.com', ['finance']),
]

type InvitesResultOptions = {
  collection?: ReturnType<typeof createMockInvite>[]
  totalCount?: number
  totalPages?: number
}

export const buildInvitesResult = ({
  collection = mockInvitations,
  totalCount = collection.length,
  totalPages = 1,
}: InvitesResultOptions = {}) => ({
  data: {
    invites: {
      __typename: 'InviteCollection',
      metadata: {
        __typename: 'CollectionMetadata',
        currentPage: 1,
        totalPages,
        totalCount,
      },
      collection,
    },
  },
})
