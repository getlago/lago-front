import { InMemoryCache } from '@apollo/client'

import { CollectionMetadata } from '~/generated/graphql'

type PaginatedCollection = { metadata: CollectionMetadata; collection: Record<string, unknown>[] }

const mergePaginatedCollection = (existing: PaginatedCollection, incoming: PaginatedCollection) => {
  if (!incoming?.metadata?.currentPage || incoming?.metadata?.currentPage === 1) {
    return incoming
  }

  return {
    ...incoming,
    collection: [...(existing?.collection || []), ...(incoming.collection || [])],
  }
}

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        billableMetrics: {
          // Usefull in plan creation, where 2 combobox display billableMetrics with different recurring value
          keyArgs: ['id', 'recurring'],
          merge: mergePaginatedCollection,
        },
        plans: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        subscriptions: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        customers: {
          keyArgs: ['id', 'externalId'],
          merge: mergePaginatedCollection,
        },
        coupons: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        events: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        addOns: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        wallets: {
          keyArgs: ['customerId'],
          merge: mergePaginatedCollection,
        },
        walletTransactions: {
          keyArgs: ['walletId'],
          merge: mergePaginatedCollection,
        },
        invites: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        memberships: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        invoiceCreditNotes: {
          keyArgs: ['invoiceId'],
          merge: mergePaginatedCollection,
        },
        customerCreditNotes: {
          keyArgs: ['invoiceId'],
        },
        customerMetadata: {
          keyArgs: false,
        },
        customerInvoices: {
          keyArgs: ['customerId', 'status', 'searchTerm'],
          merge: mergePaginatedCollection,
        },
        invoices: {
          keyArgs: ['status', 'paymentStatus'],
          merge: mergePaginatedCollection,
        },
        customerPortalInvoices: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        webhooks: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        webhookEndpoints: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        appliedtaxes: {
          // Same list if fetch in same page with different results.
          // Difference is made on appliedByDefault value
          keyArgs: ['id'],
        },
        taxes: {
          // Same list if fetch in same page with different results.
          // Difference is made on appliedByDefault value
          keyArgs: ['id', 'appliedToOrganization'],
          merge: mergePaginatedCollection,
        },
      },
    },
  },
})
