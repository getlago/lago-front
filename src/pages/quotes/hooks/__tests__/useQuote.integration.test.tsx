import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
  WatchQueryFetchPolicy,
} from '@apollo/client'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { GetQuoteDocument } from '~/generated/graphql'

import { useQuote } from '../useQuote'

const QUOTE_ID = 'quote-1'
const RESTORED_CONTENT = 'content restored from the persisted cache'
const SERVER_CONTENT = 'content the server has'

const buildQuote = (content: string) => ({
  __typename: 'Quote',
  id: QUOTE_ID,
  number: 'Q-001',
  images: {},
  orderType: 'subscription_creation',
  createdAt: '2026-01-01',
  orderForms: [],
  versions: [],
  customer: {
    __typename: 'Customer',
    id: 'customer-1',
    displayName: 'Acme Corp',
    externalId: 'ext-cust-1',
    paymentTerm: {
      __typename: 'PaymentTerm',
      termType: 'net',
      days: 30,
      dayOfMonth: null,
      monthOffset: null,
    },
    currency: 'USD',
    billingConfiguration: { __typename: 'CustomerBillingConfiguration', documentLocale: 'en' },
    billingEntity: {
      __typename: 'BillingEntity',
      id: 'be-1',
      code: 'default',
      name: 'Default Entity',
      paymentTerm: {
        __typename: 'PaymentTerm',
        termType: 'net',
        days: 60,
        dayOfMonth: null,
        monthOffset: null,
      },
    },
  },
  owners: [],
  subscription: null,
  currentVersion: {
    __typename: 'QuoteVersion',
    id: 'version-1',
    status: 'draft',
    version: 1,
    currency: 'USD',
    billingEntityId: null,
    createdAt: '2026-01-01',
    content,
    billingItems: null,
    mentionVariables: {},
  },
})

// A page load with the persisted cache already restored: the query answers from that snapshot
// while the server response is still in flight.
const renderWithWarmCache = async (
  fetchPolicy?: WatchQueryFetchPolicy,
): Promise<Array<{ loading: boolean; content: string | null | undefined }>> => {
  const cache = new InMemoryCache()

  const link = new ApolloLink(
    () =>
      new Observable((observer) => {
        setTimeout(() => {
          observer.next({ data: { quote: buildQuote(SERVER_CONTENT) } })
          observer.complete()
        }, 10)
      }),
  )

  const client = new ApolloClient({
    cache,
    link,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
    },
  })

  cache.writeQuery({
    query: GetQuoteDocument,
    variables: { id: QUOTE_ID },
    data: { quote: buildQuote(RESTORED_CONTENT) },
  })

  const renders: Array<{ loading: boolean; content: string | null | undefined }> = []

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  )

  renderHook(
    () => {
      const result = useQuote(QUOTE_ID, fetchPolicy ? { fetchPolicy } : undefined)

      renders.push({
        loading: result.loading,
        content: result.quote?.currentVersion?.content,
      })

      return result
    },
    { wrapper },
  )

  await waitFor(() => expect(renders.at(-1)?.content).toBe(SERVER_CONTENT))

  return renders
}

describe('useQuote — page load with a restored cache', () => {
  describe('GIVEN the persisted cache holds content the server has since replaced', () => {
    describe('WHEN the quote is read with network-only', () => {
      it('THEN should never expose the restored content as settled data', async () => {
        const renders = await renderWithWarmCache('network-only')

        const settledWithRestoredContent = renders.filter(
          (render) => !render.loading && render.content === RESTORED_CONTENT,
        )

        expect(settledWithRestoredContent).toHaveLength(0)
      })

      it('THEN should settle on the content the server has', async () => {
        const renders = await renderWithWarmCache('network-only')

        expect(renders.at(-1)).toEqual({ loading: false, content: SERVER_CONTENT })
      })
    })

    // The app defaults hand out a settled render carrying the restored content, which is why the
    // edit page asks for network-only: its editor reads the content once, when it mounts.
    describe('WHEN the quote is read with the app default policy', () => {
      it('THEN should expose the restored content as settled data', async () => {
        const renders = await renderWithWarmCache()

        const settledWithRestoredContent = renders.filter(
          (render) => !render.loading && render.content === RESTORED_CONTENT,
        )

        expect(settledWithRestoredContent.length).toBeGreaterThan(0)
      })
    })
  })
})
