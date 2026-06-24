import { FieldPolicy, InMemoryCache } from '@apollo/client'

import {
  createPaginatedFieldPolicy,
  createSinglePageFieldPolicy,
  mergePaginatedCollection,
} from './cacheHelpers'

// Every root query field consumed via fetchMore needs a merge policy here, otherwise
// page-2 results are stored under a page-specific storeFieldName and infinite scroll
// silently stops. Guarded by __tests__/cache.test.ts.
export const queryFieldPolicies: Record<string, FieldPolicy> = {
  // Standard paginated queries - automatically cache by all args except page/limit/offset
  activityLogs: createPaginatedFieldPolicy(),
  addOns: createPaginatedFieldPolicy(),
  apiKeys: createPaginatedFieldPolicy(),
  appliedCoupons: createPaginatedFieldPolicy(),
  billableMetrics: createPaginatedFieldPolicy(),
  // billingEntity: createPaginatedFieldPolicy(),
  coupons: createPaginatedFieldPolicy(),
  creditNotes: createPaginatedFieldPolicy(),
  customerInvoices: createPaginatedFieldPolicy(),
  // POC: numbered pagination (replace pages instead of appending) — see CustomersList
  customers: createSinglePageFieldPolicy(),
  dunningCampaigns: createPaginatedFieldPolicy(),
  events: createPaginatedFieldPolicy(),
  features: createPaginatedFieldPolicy(),
  invites: createPaginatedFieldPolicy(),
  invoiceCreditNotes: createPaginatedFieldPolicy(),
  invoiceCustomSections: createPaginatedFieldPolicy(),
  invoices: createPaginatedFieldPolicy(),
  memberships: createPaginatedFieldPolicy(),
  orderForms: createPaginatedFieldPolicy(),
  payments: createPaginatedFieldPolicy(),
  plans: createPaginatedFieldPolicy(),
  pricingUnits: createPaginatedFieldPolicy(),
  quotes: createPaginatedFieldPolicy(),
  // POC: numbered pagination (replace pages instead of appending) — shared by
  // SubscriptionsPage and PlanSubscriptionList, both migrated to <PaginatedContent>
  subscriptions: createSinglePageFieldPolicy(),
  taxes: createPaginatedFieldPolicy(),
  wallets: createPaginatedFieldPolicy(),
  walletTransactions: createPaginatedFieldPolicy(),
  walletTransactionFundings: createPaginatedFieldPolicy(),
  walletTransactionConsumptions: createPaginatedFieldPolicy(),
  webhook: createPaginatedFieldPolicy(),
  webhookEndpoint: createPaginatedFieldPolicy(),
  // POC: numbered pagination (replace pages instead of appending) — webhook logs (WebhookLogs)
  webhooks: createSinglePageFieldPolicy(),

  // Queries where ALL invocations share the same cache (no arg-based separation)
  apiLogs: {
    keyArgs: false,
    merge: mergePaginatedCollection,
  },
  securityLogs: {
    keyArgs: false,
    merge: mergePaginatedCollection,
  },
  customerPortalInvoices: {
    keyArgs: false,
    merge: mergePaginatedCollection,
  },
  customerPortalWallets: {
    keyArgs: false,
    merge: mergePaginatedCollection,
  },
  dataApiMrrsPlans: {
    keyArgs: false,
    merge: mergePaginatedCollection,
  },
  dataApiRevenueStreamsCustomers: {
    keyArgs: false,
    merge: mergePaginatedCollection,
  },
  dataApiRevenueStreamsPlans: {
    keyArgs: false,
    merge: mergePaginatedCollection,
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
