import { InMemoryCache } from '@apollo/client'

import { createPaginatedFieldPolicy, mergePaginatedCollection } from './cacheHelpers'

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Standard paginated queries - automatically cache by all args except page/limit/offset
        activityLogs: createPaginatedFieldPolicy(),
        addOns: createPaginatedFieldPolicy(),
        billableMetrics: createPaginatedFieldPolicy(),
        // billingEntity: createPaginatedFieldPolicy(),
        coupons: createPaginatedFieldPolicy(),
        creditNotes: createPaginatedFieldPolicy(),
        customerInvoices: createPaginatedFieldPolicy(),
        customers: createPaginatedFieldPolicy(),
        features: createPaginatedFieldPolicy(),
        invites: createPaginatedFieldPolicy(),
        invoiceCreditNotes: createPaginatedFieldPolicy(),
        invoiceCustomSections: createPaginatedFieldPolicy(),
        invoices: createPaginatedFieldPolicy(),
        memberships: createPaginatedFieldPolicy(),
        payments: createPaginatedFieldPolicy(),
        plans: createPaginatedFieldPolicy(),
        pricingUnits: createPaginatedFieldPolicy(),
        subscriptions: createPaginatedFieldPolicy(),
        taxes: createPaginatedFieldPolicy(),
        wallets: createPaginatedFieldPolicy(),
        walletTransactions: createPaginatedFieldPolicy(),
        webhook: createPaginatedFieldPolicy(),
        webhookEndpoint: createPaginatedFieldPolicy(),
        webhooks: createPaginatedFieldPolicy(),

        // Queries where ALL invocations share the same cache (no arg-based separation)
        apiLogs: {
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
        events: {
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
      },
    },
  },
})
