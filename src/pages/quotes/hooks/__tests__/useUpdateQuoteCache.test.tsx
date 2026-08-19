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

const MENTION_VARIABLES_FRAGMENT = gql`
  fragment TestQuoteVersionMentionVariables on QuoteVersion {
    mentionVariables
  }
`

const STALE_VARIABLES = { billing_entity_name: 'First Entity', quote_currency: CurrencyEnum.Eur }
const FRESH_VARIABLES = { billing_entity_name: 'Second Entity', quote_currency: CurrencyEnum.Aud }

const cacheEntityId = (cache: InMemoryCache): string =>
  cache.identify({ __typename: 'QuoteVersion', id: VERSION_ID }) as string

const readMentionVariables = (cache: InMemoryCache): Record<string, string> | null => {
  const result = cache.readFragment<{ mentionVariables: Record<string, string> }>({
    id: cacheEntityId(cache),
    fragment: MENTION_VARIABLES_FRAGMENT,
  })

  return result?.mentionVariables ?? null
}

/** Seeds the normalized QuoteVersion the quote preview reads its variables from. */
const seedCache = (): InMemoryCache => {
  const cache = new InMemoryCache()

  cache.writeFragment({
    id: cacheEntityId(cache),
    fragment: MENTION_VARIABLES_FRAGMENT,
    data: { __typename: 'QuoteVersion', mentionVariables: STALE_VARIABLES },
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

describe('useUpdateQuote — mention variables cache refresh', () => {
  describe('GIVEN a cached quote version whose rendered variables name the previous entity', () => {
    describe.each([
      ['the billing entity changes', { id: VERSION_ID, billingEntityId: 'be-2' }],
      ['the currency changes', { id: VERSION_ID, currency: CurrencyEnum.Aud }],
    ])('WHEN %s', (_, input) => {
      it('THEN should refresh mentionVariables on the normalized version', async () => {
        const cache = seedCache()

        expect(readMentionVariables(cache)).toEqual(STALE_VARIABLES)

        const { result } = renderHook(() => useUpdateQuote(), {
          wrapper: buildWrapper(cache, input),
        })

        await act(async () => {
          await result.current.updateQuoteVersion(input, false)
        })

        // The mutation selects mentionVariables back, so writing its result into the cache
        // replaces the stale dict the preview was rendering (LAGO-1839).
        await waitFor(() => {
          expect(readMentionVariables(cache)).toEqual(FRESH_VARIABLES)
        })
      })
    })
  })
})
