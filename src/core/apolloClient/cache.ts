import { InMemoryCache } from '@apollo/client'

import { createPaginatedFieldPolicy, mergePaginatedCollection } from './cacheHelpers'

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Standard paginated queries - automatically cache by all args except page/limit/offset
        activityLogs: createPaginatedFieldPolicy(),
        billableMetrics: createPaginatedFieldPolicy(),
        plans: createPaginatedFieldPolicy(),
        subscriptions: createPaginatedFieldPolicy(),
        customers: createPaginatedFieldPolicy(),
        coupons: createPaginatedFieldPolicy(),
        addOns: createPaginatedFieldPolicy(),
        wallets: createPaginatedFieldPolicy(),
        walletTransactions: createPaginatedFieldPolicy(),
        invites: createPaginatedFieldPolicy(),
        memberships: createPaginatedFieldPolicy(),
        invoiceCreditNotes: createPaginatedFieldPolicy(),
        invoiceCustomSections: createPaginatedFieldPolicy(),
        pricingUnits: createPaginatedFieldPolicy(),
        creditNotes: createPaginatedFieldPolicy(),
        customerInvoices: createPaginatedFieldPolicy(),
        invoices: createPaginatedFieldPolicy(),
        payments: createPaginatedFieldPolicy(),
        webhooks: createPaginatedFieldPolicy(),
        webhook: createPaginatedFieldPolicy(),
        webhookEndpoint: createPaginatedFieldPolicy(),
        taxes: createPaginatedFieldPolicy(),
        features: createPaginatedFieldPolicy(),

        // Queries where ALL invocations share the same cache (no arg-based separation)
        dataApiRevenueStreamsPlans: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        dataApiRevenueStreamsCustomers: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        dataApiMrrsPlans: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        events: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        apiLogs: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        customerPortalWallets: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        customerPortalInvoices: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        customerPortalUser: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },

        // Non-paginated field (no merge function needed)
        customerMetadata: {
          keyArgs: false,
        },
        appliedtaxes: {
          keyArgs: false,
        },
      },
    },
  },
})
