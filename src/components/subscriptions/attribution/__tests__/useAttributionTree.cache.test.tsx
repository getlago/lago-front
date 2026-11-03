import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
  Operation,
} from '@apollo/client'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { AttributedUsageBasisEnum, CurrencyEnum } from '~/generated/graphql'

import { AttributionLevel, getAttributionNodeKey } from '../attributionTree'
import { AttributionTreeNodes, useAttributionTree } from '../useAttributionTree'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const ROOT_KEY = getAttributionNodeKey([])
const departmentLevel: AttributionLevel = { code: 'department', name: 'Department', isLeaf: true }
const teamLevel: AttributionLevel = { code: 'team', name: 'Team', isLeaf: true }

const variables = {
  subscriptionId: 'subscription-1',
  basis: AttributedUsageBasisEnum.Units,
  limit: 50,
  fromDatetime: '2026-09-01T00:00:00.000Z',
  toDatetime: '2026-09-30T23:59:59.000Z',
}

const DAY_MS = 86_400_000

const buildAttributedUsage = (amountCents: string) => ({
  __typename: 'AttributedUsage',
  currency: CurrencyEnum.Usd,
  splitFiltersCount: null,
  splitFiltersLimit: null,
  fromDatetime: new Date(Date.now() - DAY_MS).toISOString(),
  toDatetime: new Date(Date.now() + DAY_MS).toISOString(),
  metadata: { __typename: 'CollectionMetadata', currentPage: 1, totalPages: 1 },
  rows: [
    {
      __typename: 'AttributedUsageRow',
      value: 'gtm',
      amountCents,
      splitChargeUnits: null,
      chargesUsage: [],
    },
  ],
  unattributed: {
    __typename: 'AttributedUsageAggregate',
    amountCents: '0',
    splitChargeUnits: null,
    chargesUsage: [],
  },
  totals: {
    __typename: 'AttributedUsageAggregate',
    amountCents,
    splitChargeUnits: null,
    chargesUsage: [],
  },
})

type Server = {
  operations: Operation[]
  link: ApolloLink
  setAmountCents: (amountCents: string) => void
}

const createServer = (initialAmountCents: string): Server => {
  const operations: Operation[] = []
  let amountCents = initialAmountCents

  const link = new ApolloLink((operation) => {
    operations.push(operation)

    return new Observable((observer) => {
      observer.next({ data: { attributedUsage: buildAttributedUsage(amountCents) } })
      observer.complete()
    })
  })

  return {
    operations,
    link,
    setAmountCents: (next) => {
      amountCents = next
    },
  }
}

const createClient = (link: ApolloLink, cache = new InMemoryCache()) =>
  new ApolloClient({ link, cache })

const wrapperOf = (client: ApolloClient<unknown>) => {
  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  )

  return Wrapper
}

const getRootAmountCents = (nodes: AttributionTreeNodes): string | null | undefined => {
  const root = nodes[ROOT_KEY]

  return root?.status === 'loaded' ? root.blocks[0].usages[0].totals.amountCents : undefined
}

const levelProps = (level: AttributionLevel) => ({
  variables,
  getChildLevels: () => [level],
  resetKey: level.code,
  skip: false,
})

describe('useAttributionTree with a real Apollo cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a view was fetched, then refreshed on another view', () => {
    describe('WHEN the user switches back to the first view', () => {
      it('THEN should refetch it instead of reading the stale cached response', async () => {
        const server = createServer('26010500')
        const client = createClient(server.link)
        const { result, rerender } = renderHook(
          (props: Parameters<typeof useAttributionTree>[0]) => useAttributionTree(props),
          { initialProps: levelProps(departmentLevel), wrapper: wrapperOf(client) },
        )

        await waitFor(() => expect(getRootAmountCents(result.current.nodes)).toBe('26010500'))

        rerender(levelProps(teamLevel))
        await waitFor(() => expect(server.operations).toHaveLength(2))
        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        server.setAmountCents('26110500')
        await act(async () => result.current.refresh())
        await waitFor(() => expect(getRootAmountCents(result.current.nodes)).toBe('26110500'))

        rerender(levelProps(departmentLevel))
        await waitFor(() => expect(server.operations).toHaveLength(4))
        await waitFor(() => expect(getRootAmountCents(result.current.nodes)).toBe('26110500'))

        expect(server.operations.map(({ variables: { groupBy } }) => groupBy)).toEqual([
          'department',
          'team',
          'team',
          'department',
        ])
      })
    })
  })

  describe('GIVEN a cache restored from an earlier session', () => {
    describe('WHEN a fresh tree mounts on a combination that session had fetched', () => {
      it('THEN should request it from the network and show the current value', async () => {
        const chargeVariables = { ...variables, chargeIds: ['charge-1'] }
        const serverA = createServer('0')
        const clientA = createClient(serverA.link)
        const hookA = renderHook(
          (props: Parameters<typeof useAttributionTree>[0]) => useAttributionTree(props),
          {
            initialProps: { ...levelProps(departmentLevel), variables: chargeVariables },
            wrapper: wrapperOf(clientA),
          },
        )

        await waitFor(() => expect(getRootAmountCents(hookA.result.current.nodes)).toBe('0'))

        const serverB = createServer('120000')
        const clientB = createClient(
          serverB.link,
          new InMemoryCache().restore(clientA.cache.extract()),
        )
        const hookB = renderHook(
          (props: Parameters<typeof useAttributionTree>[0]) => useAttributionTree(props),
          {
            initialProps: { ...levelProps(departmentLevel), variables: chargeVariables },
            wrapper: wrapperOf(clientB),
          },
        )

        await waitFor(() => expect(hookB.result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        expect(serverB.operations).toHaveLength(1)
        expect(getRootAmountCents(hookB.result.current.nodes)).toBe('120000')
      })
    })
  })
})
