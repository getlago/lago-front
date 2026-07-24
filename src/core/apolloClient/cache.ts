import { FieldPolicy, InMemoryCache } from '@apollo/client'

import { createPaginatedFieldPolicy, createSinglePageFieldPolicy } from './cacheHelpers'

// Every root query field consumed via fetchMore needs a merge policy here, otherwise
// page-2 results are stored under a page-specific storeFieldName and the list silently
// stops. Guarded by __tests__/cache.test.ts.
//
// `createSinglePageFieldPolicy()` = NUMBERED pagination (replace pages, one page shown at
// a time — the list is wrapped in `<PaginatedContent>` / renders a `<Pagination>` control).
// `createPaginatedFieldPolicy()` = legacy infinite scroll (append pages). Only fields with
// no numbered-pagination consumer remain on the append policy.
export const queryFieldPolicies: Record<string, FieldPolicy> = {
  // Numbered pagination — replace pages instead of appending (migrated off infinite scroll)
  activityLogs: createSinglePageFieldPolicy(),
  addOns: createSinglePageFieldPolicy(),
  apiKeys: createSinglePageFieldPolicy(),
  appliedCoupons: createSinglePageFieldPolicy(),
  billableMetrics: createSinglePageFieldPolicy(),
  coupons: createSinglePageFieldPolicy(),
  creditNotes: createSinglePageFieldPolicy(),
  customerInvoices: createSinglePageFieldPolicy(),
  customers: createSinglePageFieldPolicy(),
  dunningCampaigns: createSinglePageFieldPolicy(),
  events: createSinglePageFieldPolicy(),
  features: createSinglePageFieldPolicy(),
  invites: createSinglePageFieldPolicy(),
  invoiceCreditNotes: createSinglePageFieldPolicy(),
  invoiceCustomSections: createSinglePageFieldPolicy(),
  invoices: createSinglePageFieldPolicy(),
  memberships: createSinglePageFieldPolicy(),
  orderForms: createSinglePageFieldPolicy(),
  orders: createSinglePageFieldPolicy(),
  payments: createSinglePageFieldPolicy(),
  plans: createSinglePageFieldPolicy(),
  pricingUnits: createSinglePageFieldPolicy(),
  quotes: createSinglePageFieldPolicy(),
  subscriptions: createSinglePageFieldPolicy(),
  taxes: createSinglePageFieldPolicy(),
  wallets: createSinglePageFieldPolicy(),
  walletTransactions: createSinglePageFieldPolicy(),
  walletTransactionFundings: createSinglePageFieldPolicy(),
  walletTransactionConsumptions: createSinglePageFieldPolicy(),
  webhooks: createSinglePageFieldPolicy(),

  // Not yet migrated to numbered pagination — still append (infinite scroll)
  webhook: createPaginatedFieldPolicy(),
  webhookEndpoint: createPaginatedFieldPolicy(),

  // Queries where ALL invocations share the same cache (no arg-based separation).
  // Numbered pagination → replace pages (keep keyArgs:false, replace merge in place).
  apiLogs: {
    keyArgs: false,
    merge: (_existing, incoming) => incoming,
  },
  securityLogs: {
    keyArgs: false,
    merge: (_existing, incoming) => incoming,
  },
  customerPortalInvoices: {
    keyArgs: false,
    merge: (_existing, incoming) => incoming,
  },
  customerPortalWallets: {
    keyArgs: false,
    merge: (_existing, incoming) => incoming,
  },
  dataApiMrrsPlans: {
    keyArgs: false,
    merge: (_existing, incoming) => incoming,
  },
  dataApiRevenueStreamsCustomers: {
    keyArgs: false,
    merge: (_existing, incoming) => incoming,
  },
  dataApiRevenueStreamsPlans: {
    keyArgs: false,
    merge: (_existing, incoming) => incoming,
  },

  // Non-paginated field (no merge function needed)
  appliedtaxes: {
    keyArgs: false,
  },
  customerMetadata: {
    keyArgs: false,
  },
}

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: queryFieldPolicies,
    },
  },
})
