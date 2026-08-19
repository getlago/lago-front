import { gql, InMemoryCache } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { CurrencyEnum, UpdateQuoteVersionDocument } from '~/generated/graphql'

import { useUpdateQuote } from '../useUpdateQuote'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const VERSION_ID = 'version-1'

const VERSION_FRAGMENT = gql`
  fragment TestQuoteVersionCachedFields on QuoteVersion {
    mentionVariables
    billingItems
  }
`

const STALE_VARIABLES = { billing_entity_name: 'First Entity', quote_currency: CurrencyEnum.Eur }
const FRESH_VARIABLES = { billing_entity_name: 'Second Entity', quote_currency: CurrencyEnum.Aud }

// A currency change restamps the currency every billing item carries, server-side.
const STALE_BILLING_ITEMS = {
  plans: [{ id: 'plan-1', payload: {}, overrides: { amountCurrency: CurrencyEnum.Eur } }],
  walletCredits: [{ payload: { currency: CurrencyEnum.Eur } }],
}
const FRESH_BILLING_ITEMS = {
  plans: [{ id: 'plan-1', payload: {}, overrides: { amountCurrency: CurrencyEnum.Aud } }],
  walletCredits: [{ payload: { currency: CurrencyEnum.Aud } }],
}

const cacheEntityId = (cache: InMemoryCache): string =>
  cache.identify({ __typename: 'QuoteVersion', id: VERSION_ID }) as string

const readVersion = (
  cache: InMemoryCache,
): { mentionVariables: Record<string, string>; billingItems: unknown } | null =>
  cache.readFragment({
    id: cacheEntityId(cache),
    fragment: VERSION_FRAGMENT,
  })

/** Seeds the normalized QuoteVersion the quote preview reads its variables from. */
const seedCache = (): InMemoryCache => {
  const cache = new InMemoryCache()

  cache.writeFragment({
    id: cacheEntityId(cache),
    fragment: VERSION_FRAGMENT,
    data: {
      __typename: 'QuoteVersion',
      mentionVariables: STALE_VARIABLES,
      billingItems: STALE_BILLING_ITEMS,
    },
  })

  return cache
}

const buildWrapper = (cache: InMemoryCache, variables: Record<string, unknown>) => {
  const mocks = [
    {
      request: { query: UpdateQuoteVersionDocument, variables: { input: variables } },
      result: {
        data: {
          updateQuoteVersion: {
            __typename: 'QuoteVersion',
            id: VERSION_ID,
            currency: CurrencyEnum.Aud,
            billingEntityId: 'be-2',
            mentionVariables: FRESH_VARIABLES,
            billingItems: FRESH_BILLING_ITEMS,
          },
        },
      },
    },
  ]

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider cache={cache} mocks={mocks}>
      {children}
    </MockedProvider>
  )

  Wrapper.displayName = 'MockedCacheWrapper'

  return Wrapper
}

describe('useUpdateQuote — server-recomputed fields refresh in the cache', () => {
  describe('GIVEN a cached quote version still carrying the values of the previous currency', () => {
    describe.each([
      ['the billing entity changes', { id: VERSION_ID, billingEntityId: 'be-2' }],
      ['the currency changes', { id: VERSION_ID, currency: CurrencyEnum.Aud }],
    ])('WHEN %s', (_, input) => {
      it('THEN should refresh the mention variables and the billing items it restamped', async () => {
        const cache = seedCache()

        expect(readVersion(cache)?.mentionVariables).toEqual(STALE_VARIABLES)
        expect(readVersion(cache)?.billingItems).toEqual(STALE_BILLING_ITEMS)

        const { result } = renderHook(() => useUpdateQuote(), {
          wrapper: buildWrapper(cache, input),
        })

        await act(async () => {
          await result.current.updateQuoteVersion(input, false)
        })

        // The mutation selects both fields back, so writing its result into the cache replaces the
        // stale dict the preview was rendering (LAGO-1839) and the stale currency the billing items
        // were carrying.
        await waitFor(() => {
          expect(readVersion(cache)?.mentionVariables).toEqual(FRESH_VARIABLES)
        })
        expect(readVersion(cache)?.billingItems).toEqual(FRESH_BILLING_ITEMS)
      })
    })
  })
})
