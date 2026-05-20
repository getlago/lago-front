import { gql, InMemoryCache, Reference } from '@apollo/client'

import { cacheArrayInsert, cacheArrayRemove } from '../cacheHelpers'

const PROBE_QUERY = gql`
  query Probe {
    plan(id: "plan_1") @client {
      __typename
      id
      charges {
        __typename
        id
        invoiceDisplayName
      }
    }
  }
`

const buildCache = () => {
  const cache = new InMemoryCache()

  cache.writeQuery({
    query: PROBE_QUERY,
    data: {
      plan: {
        __typename: 'Plan',
        id: 'plan_1',
        charges: [
          { __typename: 'Charge', id: 'charge_a', invoiceDisplayName: 'A' },
          { __typename: 'Charge', id: 'charge_b', invoiceDisplayName: 'B' },
        ],
      },
    },
  })

  return cache
}

describe('cacheHelpers', () => {
  it('cacheArrayInsert appends a new item to the parent field', () => {
    const cache = buildCache()

    cacheArrayInsert(
      cache,
      { __typename: 'Plan', id: 'plan_1' },
      'charges',
      { __typename: 'Charge', id: 'charge_c', invoiceDisplayName: 'C' },
    )

    const result = cache.extract()
    const planEntry = result['Plan:plan_1'] as { charges: Reference[] }

    expect(planEntry.charges).toHaveLength(3)
    expect(planEntry.charges[2].__ref).toBe('Charge:charge_c')
  })

  it('cacheArrayRemove drops the matching item and evicts the entity', () => {
    const cache = buildCache()

    cacheArrayRemove(
      cache,
      { __typename: 'Plan', id: 'plan_1' },
      'charges',
      'charge_a',
      'Charge',
    )

    const result = cache.extract()
    const planEntry = result['Plan:plan_1'] as { charges: Reference[] }

    expect(planEntry.charges).toHaveLength(1)
    expect(result['Charge:charge_a']).toBeUndefined()
  })
})
