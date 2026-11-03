import { ApolloError } from '@apollo/client'
import { act, renderHook, waitFor } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { AttributedUsageBasisEnum, CurrencyEnum } from '~/generated/graphql'

import { AttributionLevel, AttributionPathStep, getAttributionNodeKey } from '../attributionTree'
import { AttributionTreeUsage, useAttributionTree } from '../useAttributionTree'

const mockQuery = jest.fn()
const mockClient = { query: (...args: unknown[]) => mockQuery(...args) }

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => mockClient,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const departmentLevel: AttributionLevel = { code: 'department', name: 'Department', isLeaf: false }
const teamLevel: AttributionLevel = { code: 'team', name: 'Team', isLeaf: false }
const costCenterLevel: AttributionLevel = { code: 'cost_center', name: 'Cost', isLeaf: true }

const getChildLevels = (parentCode: string | null): AttributionLevel[] => {
  if (!parentCode) return [departmentLevel]
  if (parentCode === 'department') return [teamLevel, costCenterLevel]

  return []
}

const currentPeriodVariables = {
  subscriptionId: 'subscription-1',
  basis: AttributedUsageBasisEnum.Units,
  limit: 50,
}

const userWindow = {
  fromDatetime: '2026-09-01T00:00:00.000Z',
  toDatetime: '2026-09-30T23:59:59.000Z',
}

const variables = { ...currentPeriodVariables, ...userWindow }

const ROOT_KEY = getAttributionNodeKey([])
const rndPath: AttributionPathStep[] = [{ code: 'department', value: 'rnd' }]
const RND_KEY = getAttributionNodeKey(rndPath)
const SPLIT_FILTERS_LIMIT = 4
const DAY_MS = 86_400_000
const ROOT_FROM = '2026-10-01T00:00:00.000Z'
const ROOT_TO = '2026-11-01T00:00:00.000Z'

const buildUsage = (
  values: string[],
  {
    currentPage = 1,
    totalPages = 1,
    splitFiltersLimit = SPLIT_FILTERS_LIMIT,
    fromDatetime = new Date(Date.now() - DAY_MS).toISOString(),
  }: {
    currentPage?: number
    totalPages?: number
    splitFiltersLimit?: number | null
    fromDatetime?: string
  } = {},
): AttributionTreeUsage => ({
  currency: CurrencyEnum.Usd,
  splitFiltersLimit,
  fromDatetime,
  toDatetime: ROOT_TO,
  metadata: { currentPage, totalPages },
  rows: values.map((value) => ({ value, amountCents: null, chargesUsage: [] })),
  unattributed: { amountCents: null, chargesUsage: [] },
  totals: { amountCents: null, chargesUsage: [] },
})

const resolveUsage = (usage: AttributionTreeUsage): Promise<unknown> =>
  Promise.resolve({ data: { attributedUsage: usage } })

const getQueryVariables = (callIndex: number): Record<string, unknown> =>
  mockQuery.mock.calls[callIndex][0].variables

const renderTree = (props: Partial<Parameters<typeof useAttributionTree>[0]> = {}) =>
  renderHook(
    (hookProps: Parameters<typeof useAttributionTree>[0]) => useAttributionTree(hookProps),
    {
      initialProps: { variables, getChildLevels, resetKey: 'key-1', skip: false, ...props },
    },
  )

const renderLoadedTree = async (rootUsage = buildUsage(['rnd', 'gtm'])) => {
  mockQuery.mockReturnValueOnce(resolveUsage(rootUsage))

  const hook = renderTree()

  await waitFor(() => expect(hook.result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

  return hook
}

describe('useAttributionTree', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the tree is skipped', () => {
    it('THEN should not fire any request', () => {
      const { result } = renderTree({ skip: true })

      expect(mockQuery).not.toHaveBeenCalled()
      expect(result.current.nodes).toEqual({})
    })
  })

  describe('GIVEN the tree mounts', () => {
    it('THEN should load the root levels without filters from the network', async () => {
      const { result } = await renderLoadedTree()

      expect(mockQuery).toHaveBeenCalledTimes(1)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchPolicy: 'no-cache',
          variables: { ...variables, groupBy: 'department', filters: undefined, page: 1 },
        }),
      )
      expect(result.current.nodes[ROOT_KEY]).toEqual(
        expect.objectContaining({ status: 'loaded', isExpanded: true }),
      )
    })
  })

  describe('GIVEN entity filters in the variables', () => {
    const entityFilters = [
      { code: 'department', values: ['rnd', 'gtm'] },
      { code: 'api_key', values: ['k_live_ab12'] },
    ]

    describe('WHEN the root levels load', () => {
      it('THEN should send the entity filters as-is', async () => {
        mockQuery.mockReturnValueOnce(resolveUsage(buildUsage(['rnd'])))

        const { result } = renderTree({ variables: { ...variables, filters: entityFilters } })

        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        expect(getQueryVariables(0)).toEqual(expect.objectContaining({ filters: entityFilters }))
      })
    })

    describe('WHEN a node is expanded', () => {
      it('THEN should let the path replace the entity filter of the same code and keep the others', async () => {
        mockQuery.mockReturnValueOnce(resolveUsage(buildUsage(['rnd'])))

        const { result } = renderTree({ variables: { ...variables, filters: entityFilters } })

        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        mockQuery
          .mockReturnValueOnce(resolveUsage(buildUsage(['eng'])))
          .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))

        act(() => result.current.toggleNode(rndPath, 'department'))

        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        expect(getQueryVariables(1)).toEqual(
          expect.objectContaining({
            groupBy: 'team',
            filters: [
              { code: 'api_key', values: ['k_live_ab12'] },
              { code: 'department', values: ['rnd'] },
            ],
          }),
        )
      })
    })
  })

  describe('GIVEN a collapsed node', () => {
    describe('WHEN it is expanded', () => {
      it('THEN should fire one request per child level with the path filters', async () => {
        const { result } = await renderLoadedTree()

        mockQuery
          .mockReturnValueOnce(resolveUsage(buildUsage(['eng'])))
          .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))

        act(() => result.current.toggleNode(rndPath, 'department'))

        expect(result.current.nodes[RND_KEY]).toEqual({ status: 'loading' })

        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        expect(getQueryVariables(1)).toEqual(
          expect.objectContaining({
            groupBy: 'team',
            filters: [{ code: 'department', values: ['rnd'] }],
            page: 1,
          }),
        )
        expect(getQueryVariables(2)).toEqual(
          expect.objectContaining({ groupBy: 'cost_center', page: 1 }),
        )

        const node = result.current.nodes[RND_KEY]

        expect(node?.status === 'loaded' && node.blocks.map(({ level }) => level.code)).toEqual([
          'team',
          'cost_center',
        ])
      })

      it('THEN should ignore a second toggle while loading', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))

        act(() => {
          result.current.toggleNode(rndPath, 'department')
          result.current.toggleNode(rndPath, 'department')
        })

        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        expect(mockQuery).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('GIVEN an expanded node', () => {
    describe('WHEN it is collapsed then expanded again', () => {
      it('THEN should keep its children without refetching', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))
        act(() => result.current.toggleNode(rndPath, 'department'))
        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        act(() => result.current.toggleNode(rndPath, 'department'))
        expect(result.current.nodes[RND_KEY]).toEqual(
          expect.objectContaining({ isExpanded: false }),
        )

        act(() => result.current.toggleNode(rndPath, 'department'))
        expect(result.current.nodes[RND_KEY]).toEqual(expect.objectContaining({ isExpanded: true }))
        expect(mockQuery).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('GIVEN a level with more pages', () => {
    describe('WHEN loading more rows of a nested level', () => {
      it('THEN should append the next page to that level only', async () => {
        const { result } = await renderLoadedTree()

        mockQuery
          .mockReturnValueOnce(resolveUsage(buildUsage(['eng'], { totalPages: 2 })))
          .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))
        act(() => result.current.toggleNode(rndPath, 'department'))
        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        mockQuery.mockReturnValueOnce(
          resolveUsage(buildUsage(['data'], { currentPage: 2, totalPages: 2 })),
        )

        await act(async () => result.current.loadMore(rndPath, 0))

        expect(getQueryVariables(3)).toEqual(
          expect.objectContaining({
            groupBy: 'team',
            filters: [{ code: 'department', values: ['rnd'] }],
            page: 2,
          }),
        )

        const node = result.current.nodes[RND_KEY]
        const root = result.current.nodes[ROOT_KEY]

        expect(
          node?.status === 'loaded' && node.blocks[0].usages[0].rows.map(({ value }) => value),
        ).toEqual(['eng', 'data'])
        expect(node?.status === 'loaded' && node.blocks[0].usages[0].metadata.currentPage).toBe(2)
        expect(node?.status === 'loaded' && node.blocks[1].usages[0].rows).toHaveLength(1)
        expect(root?.status === 'loaded' && root.blocks[0].usages[0].rows).toHaveLength(2)
      })
    })

    describe('WHEN loading more rows fails with a network error', () => {
      it('THEN should toast and keep the level retryable', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockRejectedValueOnce(new Error('network'))

        await act(async () => result.current.loadMore([], 0))

        const root = result.current.nodes[ROOT_KEY]

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(root?.status === 'loaded' && root.blocks[0].isLoadingMore).toBe(false)
      })
    })
  })

  describe('GIVEN the root levels fail to load', () => {
    describe('WHEN the error is a network error', () => {
      it('THEN should silence the request and mark the root as errored without a toast', async () => {
        mockQuery.mockRejectedValueOnce(new Error('network'))

        const { result } = renderTree()

        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('error'))

        expect(mockQuery).toHaveBeenCalledWith(
          expect.objectContaining({ context: { silentError: true } }),
        )
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a nested level loads', () => {
    describe('WHEN a node is expanded or the root loads more rows', () => {
      it('THEN should leave the requests to the global error toast', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['cc-1'])))

        await act(async () => result.current.toggleNode(rndPath, 'department'))
        await act(async () => result.current.loadMore([], 0))

        mockQuery.mock.calls.slice(1).forEach(([options]) => {
          expect(options.context).toEqual({ silentError: false })
        })
      })
    })
  })

  describe('GIVEN expanding a node fails', () => {
    describe('WHEN the error is a GraphQL error', () => {
      it('THEN should mark the node as errored without a second toast', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['cc-1'])))
        mockQuery.mockRejectedValueOnce(
          new ApolloError({
            graphQLErrors: [
              { message: 'Unprocessable Entity', extensions: { code: 'too_many_groups' } },
            ],
          }),
        )

        await act(async () => result.current.toggleNode(rndPath, 'department'))

        expect(result.current.nodes[RND_KEY]).toEqual({
          status: 'error',
          error: expect.any(ApolloError),
        })
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the node is toggled again', () => {
      it('THEN should retry the request', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['cc-1'])))
        mockQuery.mockRejectedValueOnce(new Error('network'))
        await act(async () => result.current.toggleNode(rndPath, 'department'))

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))
        act(() => result.current.toggleNode(rndPath, 'department'))

        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))
      })
    })
  })

  describe('GIVEN the tree is refreshed', () => {
    it('THEN should reload the root and keep the expanded children expanded', async () => {
      const { result } = await renderLoadedTree()

      mockQuery
        .mockReturnValueOnce(resolveUsage(buildUsage(['eng'])))
        .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))
      act(() => result.current.toggleNode(rndPath, 'department'))
      await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

      mockQuery.mockClear()
      mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd', 'gtm'])))

      await act(async () => result.current.refresh())
      await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

      expect(result.current.nodes[RND_KEY]).toEqual(expect.objectContaining({ isExpanded: true }))
      expect(mockQuery).toHaveBeenCalledTimes(3)
      expect(mockQuery.mock.calls.map(([options]) => options.fetchPolicy)).toEqual([
        'no-cache',
        'no-cache',
        'no-cache',
      ])
    })

    it('THEN should not reload an expanded node hidden under a collapsed one', async () => {
      const ENG_KEY = getAttributionNodeKey([...rndPath, { code: 'team', value: 'eng' }])
      const { result } = await renderLoadedTree()

      mockQuery
        .mockReturnValueOnce(resolveUsage(buildUsage(['eng'])))
        .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))
      act(() => result.current.toggleNode(rndPath, 'department'))
      await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

      mockQuery.mockReturnValue(resolveUsage(buildUsage(['x'])))
      act(() => result.current.toggleNode([...rndPath, { code: 'team', value: 'eng' }], 'team'))
      await waitFor(() => expect(result.current.nodes[ENG_KEY]?.status).toBe('loaded'))
      act(() => result.current.toggleNode(rndPath, 'department'))
      mockQuery.mockClear()

      await act(async () => result.current.refresh())
      await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

      expect(mockQuery).toHaveBeenCalledTimes(1)
      expect(result.current.nodes[ENG_KEY]).toBeUndefined()
    })

    it('THEN should refetch every page a level had loaded', async () => {
      const { result } = await renderLoadedTree()

      mockQuery.mockReturnValueOnce(
        resolveUsage(buildUsage(['data'], { currentPage: 2, totalPages: 2 })),
      )
      await act(async () => result.current.loadMore([], 0))

      mockQuery.mockClear()
      mockQuery
        .mockReturnValueOnce(resolveUsage(buildUsage(['rnd', 'gtm'], { totalPages: 2 })))
        .mockReturnValueOnce(resolveUsage(buildUsage(['data'], { currentPage: 2, totalPages: 2 })))

      await act(async () => result.current.refresh())

      expect(mockQuery).toHaveBeenCalledTimes(2)
      expect(getQueryVariables(0)).toEqual(expect.objectContaining({ page: 1 }))
      expect(getQueryVariables(1)).toEqual(expect.objectContaining({ page: 2 }))

      const root = result.current.nodes[ROOT_KEY]

      expect(
        root?.status === 'loaded' && root.blocks[0].usages[0].rows.map(({ value }) => value),
      ).toEqual(['rnd', 'gtm', 'data'])
      expect(root?.status === 'loaded' && root.blocks[0].usages[0].metadata.currentPage).toBe(2)
    })

    it('THEN should reload the root after it failed to load', async () => {
      mockQuery.mockRejectedValueOnce(new Error('network'))

      const { result } = renderTree()

      await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('error'))

      mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))

      await act(async () => result.current.refresh())

      await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))
    })
  })

  describe('GIVEN the reset key changes', () => {
    it('THEN should collapse every node and reload the root', async () => {
      const { result, rerender } = await renderLoadedTree()

      mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))
      act(() => result.current.toggleNode(rndPath, 'department'))
      await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

      rerender({ variables, getChildLevels, resetKey: 'key-2', skip: false })

      expect(result.current.nodes[RND_KEY]).toBeUndefined()
      await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))
    })

    it('THEN should discard a response that resolves after the reset', async () => {
      const { result, rerender } = await renderLoadedTree()

      let resolveStale: (value: unknown) => void = () => undefined

      mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))
      mockQuery.mockReturnValueOnce(new Promise((resolve) => (resolveStale = resolve)))
      act(() => result.current.toggleNode(rndPath, 'department'))
      await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(3))

      rerender({ variables, getChildLevels, resetKey: 'key-2', skip: false })
      await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

      await act(async () => resolveStale({ data: { attributedUsage: buildUsage(['eng']) } }))

      expect(result.current.nodes[RND_KEY]).toBeUndefined()
    })

    it('THEN should read the network again when a previous key comes back', async () => {
      const { result, rerender } = await renderLoadedTree()

      mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))

      rerender({ variables, getChildLevels, resetKey: 'key-2', skip: false })
      await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))
      rerender({ variables, getChildLevels, resetKey: 'key-1', skip: false })
      await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

      expect(mockQuery).toHaveBeenCalledTimes(3)
      expect(mockQuery.mock.calls.map(([options]) => options.fetchPolicy)).toEqual([
        'no-cache',
        'no-cache',
        'no-cache',
      ])
    })
  })

  describe('GIVEN a superseded selection with a request still waiting for a queue slot', () => {
    describe('WHEN a slot frees up', () => {
      it('THEN should drop the superseded request and give the slot to the new selection', async () => {
        const manyLevels = Array.from({ length: 8 }, (_, index) => ({
          code: `level_${index}`,
          name: `Level ${index}`,
          isLeaf: true,
        }))
        const resolvers: Array<(value: unknown) => void> = []

        mockQuery.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)))

        const { result, rerender } = renderTree({ getChildLevels: () => manyLevels })

        await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(1))
        await act(async () => resolvers[0]({ data: { attributedUsage: buildUsage([]) } }))
        expect(mockQuery).toHaveBeenCalledTimes(7)

        rerender({ variables, getChildLevels: () => manyLevels, resetKey: 'key-2', skip: false })
        await act(async () => resolvers[1]({ data: { attributedUsage: buildUsage([]) } }))

        expect(mockQuery).toHaveBeenCalledTimes(8)
        expect(getQueryVariables(7)).toEqual(
          expect.objectContaining({ groupBy: 'level_0', page: 1 }),
        )
        expect(result.current.nodes[ROOT_KEY]).toEqual({ status: 'loading' })
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the current period', () => {
    const SNAPSHOT_1 = '2026-10-30T10:00:00.000Z'
    const SNAPSHOT_2 = '2026-10-30T10:05:00.000Z'
    const REFRESHED_ROOT_FROM = '2026-10-02T00:00:00.000Z'
    const pinnedWindow = { fromDatetime: ROOT_FROM, toDatetime: SNAPSHOT_1 }

    const getCallVariables = (): Array<Record<string, unknown>> =>
      mockQuery.mock.calls.map(([options]) => options.variables)

    const renderCurrentPeriodTree = () => renderTree({ variables: currentPeriodVariables })

    const renderLoadedCurrentPeriodTree = async (
      defaultWindowUsage = buildUsage(['rnd', 'gtm'], { fromDatetime: ROOT_FROM }),
      pinnedWindowUsage = defaultWindowUsage,
    ) => {
      mockQuery
        .mockReturnValueOnce(resolveUsage(defaultWindowUsage))
        .mockReturnValueOnce(resolveUsage(pinnedWindowUsage))

      const hook = renderCurrentPeriodTree()

      await waitFor(() => expect(hook.result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

      return hook
    }

    const expandRnd = async (result: ReturnType<typeof renderTree>['result']) => {
      mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))
      act(() => result.current.toggleNode(rndPath, 'department'))
      await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))
    }

    beforeEach(() => {
      jest.useFakeTimers({ now: new Date(SNAPSHOT_1) })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    describe('WHEN the root loads', () => {
      it('THEN should probe the default window, then reload the first page on the pinned window', async () => {
        const { result } = await renderLoadedCurrentPeriodTree(
          buildUsage(['rnd', 'gtm'], { fromDatetime: ROOT_FROM }),
          buildUsage(['gtm', 'rnd'], { fromDatetime: ROOT_FROM }),
        )

        const root = result.current.nodes[ROOT_KEY]

        expect(mockQuery).toHaveBeenCalledTimes(2)
        expect(getQueryVariables(0)).not.toHaveProperty('fromDatetime')
        expect(getQueryVariables(0)).not.toHaveProperty('toDatetime')
        expect(getQueryVariables(1)).toEqual(
          expect.objectContaining({ groupBy: 'department', page: 1, ...pinnedWindow }),
        )
        expect(
          root?.status === 'loaded' && root.blocks[0].usages[0].rows.map(({ value }) => value),
        ).toEqual(['gtm', 'rnd'])
      })
    })

    describe('WHEN a node is expanded after the root loaded', () => {
      it('THEN should pin its requests to the root window start and the reset time', async () => {
        const { result } = await renderLoadedCurrentPeriodTree()

        await expandRnd(result)

        expect(getQueryVariables(2)).toEqual(expect.objectContaining(pinnedWindow))
        expect(getQueryVariables(3)).toEqual(expect.objectContaining(pinnedWindow))
      })
    })

    describe('WHEN the tree is refreshed later', () => {
      it('THEN should hold the node reloads until the root answers, then pin every request to the new snapshot', async () => {
        const { result } = await renderLoadedCurrentPeriodTree()

        await expandRnd(result)

        let resolveProbe: (value: unknown) => void = () => undefined

        jest.setSystemTime(new Date(SNAPSHOT_2))
        mockQuery.mockClear()
        mockQuery.mockReturnValue(
          resolveUsage(buildUsage(['rnd', 'gtm'], { fromDatetime: REFRESHED_ROOT_FROM })),
        )
        mockQuery.mockReturnValueOnce(new Promise((resolve) => (resolveProbe = resolve)))

        await act(async () => result.current.refresh())

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(getQueryVariables(0)).not.toHaveProperty('toDatetime')

        await act(async () =>
          resolveProbe({
            data: {
              attributedUsage: buildUsage(['rnd', 'gtm'], { fromDatetime: REFRESHED_ROOT_FROM }),
            },
          }),
        )
        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        const refreshedWindow = { fromDatetime: REFRESHED_ROOT_FROM, toDatetime: SNAPSHOT_2 }

        expect(getCallVariables().slice(1)).toEqual([
          expect.objectContaining({ groupBy: 'department', page: 1, ...refreshedWindow }),
          expect.objectContaining({ groupBy: 'team', ...refreshedWindow }),
          expect.objectContaining({ groupBy: 'cost_center', ...refreshedWindow }),
        ])
      })
    })

    describe('WHEN the selection changes while the probe is pending', () => {
      it('THEN should not refetch the superseded first page once the probe answers', async () => {
        let resolveProbe: (value: unknown) => void = () => undefined

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))
        mockQuery.mockReturnValueOnce(new Promise((resolve) => (resolveProbe = resolve)))

        const { result, rerender } = renderCurrentPeriodTree()

        await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(1))

        rerender({
          variables: currentPeriodVariables,
          getChildLevels,
          resetKey: 'key-2',
          skip: false,
        })
        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))
        expect(mockQuery).toHaveBeenCalledTimes(3)

        await act(async () => resolveProbe({ data: { attributedUsage: buildUsage(['rnd']) } }))

        expect(mockQuery).toHaveBeenCalledTimes(3)
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the selection changes while a refresh waits for its probe', () => {
      it('THEN should not send the superseded node reloads once the probe answers', async () => {
        const { result, rerender } = await renderLoadedCurrentPeriodTree()

        await expandRnd(result)

        let resolveProbe: (value: unknown) => void = () => undefined

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))
        mockQuery.mockReturnValueOnce(new Promise((resolve) => (resolveProbe = resolve)))

        await act(async () => result.current.refresh())
        expect(mockQuery).toHaveBeenCalledTimes(5)

        rerender({
          variables: currentPeriodVariables,
          getChildLevels,
          resetKey: 'key-2',
          skip: false,
        })
        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        const callsAfterReset = mockQuery.mock.calls.length

        await act(async () =>
          resolveProbe({ data: { attributedUsage: buildUsage(['rnd', 'gtm']) } }),
        )

        expect(mockQuery).toHaveBeenCalledTimes(callsAfterReset)
        expect(result.current.nodes[RND_KEY]).toBeUndefined()
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the browser clock is behind the start of the root window', () => {
      it('THEN should keep the default window on every request instead of sending from after to', async () => {
        const futureRootFrom = '2026-10-30T10:03:00.000Z'
        const { result } = await renderLoadedCurrentPeriodTree(
          buildUsage(['rnd', 'gtm'], { fromDatetime: futureRootFrom }),
        )

        await expandRnd(result)

        expect(mockQuery).toHaveBeenCalledTimes(3)
        getCallVariables().forEach((callVariables) => {
          expect(callVariables).not.toHaveProperty('fromDatetime')
          expect(callVariables).not.toHaveProperty('toDatetime')
        })
      })
    })

    describe('WHEN the root window starts more than 31 days before the snapshot', () => {
      const DEFAULT_ROOT_FROM = '2026-09-29T00:00:00.000Z'
      const CLAMPED_ROOT_FROM = '2026-09-29T10:00:00.000Z'
      const clampedWindow = { fromDatetime: CLAMPED_ROOT_FROM, toDatetime: SNAPSHOT_1 }

      it('THEN should reload the first page on the clamped window before pinning the others to it', async () => {
        const { result } = await renderLoadedCurrentPeriodTree(
          buildUsage(['rnd', 'gtm'], { fromDatetime: DEFAULT_ROOT_FROM }),
          buildUsage(['gtm', 'rnd'], { fromDatetime: CLAMPED_ROOT_FROM }),
        )

        await expandRnd(result)

        const root = result.current.nodes[ROOT_KEY]

        expect(getQueryVariables(0)).not.toHaveProperty('toDatetime')
        expect(getQueryVariables(1)).toEqual(
          expect.objectContaining({ groupBy: 'department', page: 1, ...clampedWindow }),
        )
        expect(getQueryVariables(2)).toEqual(expect.objectContaining(clampedWindow))
        expect(getQueryVariables(3)).toEqual(expect.objectContaining(clampedWindow))
        expect(
          root?.status === 'loaded' && root.blocks[0].usages[0].rows.map(({ value }) => value),
        ).toEqual(['gtm', 'rnd'])
      })

      it('THEN should page rows on the same window as the first page', async () => {
        const rowsByWindow = (fromDatetime?: string): string[] =>
          fromDatetime ? ['B', 'A'] : ['A', 'B']

        mockQuery.mockImplementation(({ variables: { fromDatetime, page } }) =>
          resolveUsage(
            buildUsage([rowsByWindow(fromDatetime)[page - 1]], {
              currentPage: page,
              totalPages: 2,
              fromDatetime: fromDatetime ?? DEFAULT_ROOT_FROM,
            }),
          ),
        )

        const { result } = renderCurrentPeriodTree()

        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))
        await act(async () => result.current.loadMore([], 0))

        const root = result.current.nodes[ROOT_KEY]

        expect(
          root?.status === 'loaded' && root.blocks[0].usages[0].rows.map(({ value }) => value),
        ).toEqual(['B', 'A'])
        expect(getCallVariables().slice(1)).toEqual([
          expect.objectContaining({ page: 1, ...clampedWindow }),
          expect.objectContaining({ page: 2, ...clampedWindow }),
        ])
      })

      it('THEN should reload every page on one new window after a refresh', async () => {
        mockQuery.mockImplementation(({ variables: { fromDatetime, page } }) =>
          resolveUsage(
            buildUsage(['rnd'], {
              currentPage: page,
              totalPages: 2,
              fromDatetime: fromDatetime ?? DEFAULT_ROOT_FROM,
            }),
          ),
        )

        const { result } = renderCurrentPeriodTree()

        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))
        await act(async () => result.current.loadMore([], 0))

        jest.setSystemTime(new Date(SNAPSHOT_2))
        mockQuery.mockClear()

        await act(async () => result.current.refresh())
        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        const refreshedWindow = { fromDatetime: '2026-09-29T10:05:00.000Z', toDatetime: SNAPSHOT_2 }

        expect(getQueryVariables(0)).not.toHaveProperty('toDatetime')
        expect(getCallVariables().slice(1)).toEqual([
          expect.objectContaining({ page: 1, ...refreshedWindow }),
          expect.objectContaining({ page: 2, ...refreshedWindow }),
        ])
      })
    })
  })

  describe('GIVEN an explicit window in the variables', () => {
    describe('WHEN the root and a node load', () => {
      it('THEN should send the window unchanged on every request, without a probe', async () => {
        mockQuery.mockReturnValueOnce(resolveUsage(buildUsage(['rnd'])))

        const { result } = renderTree()

        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))
        act(() => result.current.toggleNode(rndPath, 'department'))
        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        expect(mockQuery.mock.calls.map(([options]) => options.variables)).toEqual([
          expect.objectContaining(userWindow),
          expect.objectContaining(userWindow),
          expect.objectContaining(userWindow),
        ])
      })
    })
  })

  describe('GIVEN an explicit window ending after the reset time', () => {
    const SNAPSHOT = '2026-10-30T10:00:00.000Z'
    const ongoingWindow = {
      fromDatetime: '2026-10-15T00:00:00.000Z',
      toDatetime: '2026-10-31T23:59:59.000Z',
    }

    beforeEach(() => {
      jest.useFakeTimers({ now: new Date(SNAPSHOT) })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    describe('WHEN the root and a node load', () => {
      it('THEN should pin every request to the reset time, without a probe', async () => {
        mockQuery.mockReturnValueOnce(resolveUsage(buildUsage(['rnd'])))

        const { result } = renderTree({
          variables: { ...currentPeriodVariables, ...ongoingWindow },
        })

        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))
        act(() => result.current.toggleNode(rndPath, 'department'))
        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        const pinnedWindow = { fromDatetime: ongoingWindow.fromDatetime, toDatetime: SNAPSHOT }

        expect(mockQuery.mock.calls.map(([options]) => options.variables)).toEqual([
          expect.objectContaining(pinnedWindow),
          expect.objectContaining(pinnedWindow),
          expect.objectContaining(pinnedWindow),
        ])
      })
    })
  })

  describe('GIVEN a split charge with more filters than one page', () => {
    const OFFSET_PAGE_2 = SPLIT_FILTERS_LIMIT

    const getBlockFilterPagesCounts = (
      nodes: ReturnType<typeof useAttributionTree>['nodes'],
      key: string,
    ): number[] => {
      const node = nodes[key]

      return node?.status === 'loaded' ? node.blocks.map(({ usages }) => usages.length) : []
    }

    const getCalls = (): Array<Record<string, unknown>> =>
      mockQuery.mock.calls.map(([options]) => options.variables)

    const renderExpandedTree = async () => {
      const hook = await renderLoadedTree()

      mockQuery
        .mockReturnValueOnce(resolveUsage(buildUsage(['eng'])))
        .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))
      act(() => hook.result.current.toggleNode(rndPath, 'department'))
      await waitFor(() => expect(hook.result.current.nodes[RND_KEY]?.status).toBe('loaded'))

      mockQuery.mockClear()

      return hook
    }

    const renderTreeWithTwoFilterPages = async () => {
      const hook = await renderExpandedTree()

      mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))
      await act(async () => hook.result.current.loadMoreFilterPage())
      mockQuery.mockClear()

      return hook
    }

    describe('WHEN the next filter page is loaded', () => {
      it('THEN should request it with the next offset for every visible block', async () => {
        const { result } = await renderExpandedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))

        await act(async () => result.current.loadMoreFilterPage())

        expect(getCalls()).toEqual([
          expect.objectContaining({
            groupBy: 'department',
            page: 1,
            splitFiltersOffset: OFFSET_PAGE_2,
          }),
          expect.objectContaining({ groupBy: 'team', page: 1, splitFiltersOffset: OFFSET_PAGE_2 }),
          expect.objectContaining({
            groupBy: 'cost_center',
            page: 1,
            splitFiltersOffset: OFFSET_PAGE_2,
          }),
        ])
        expect(result.current.isLoadingFilterPage).toBe(false)
        expect(getBlockFilterPagesCounts(result.current.nodes, ROOT_KEY)).toEqual([2])
        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([2, 2])
      })

      it('THEN should offset it by the page size the root response returned', async () => {
        const { result } = await renderLoadedTree(
          buildUsage(['rnd', 'gtm'], { splitFiltersLimit: 7 }),
        )

        mockQuery.mockClear()
        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))

        await act(async () => result.current.loadMoreFilterPage())

        expect(getCalls()).toEqual([expect.objectContaining({ page: 1, splitFiltersOffset: 7 })])
      })

      it('THEN should request it for every row page a block had loaded', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValueOnce(
          resolveUsage(buildUsage(['data'], { currentPage: 2, totalPages: 2 })),
        )
        await act(async () => result.current.loadMore([], 0))
        mockQuery.mockClear()
        mockQuery.mockReturnValue(
          resolveUsage(buildUsage(['rnd'], { currentPage: 2, totalPages: 2 })),
        )

        await act(async () => result.current.loadMoreFilterPage())

        expect(getCalls()).toEqual([
          expect.objectContaining({ page: 1, splitFiltersOffset: OFFSET_PAGE_2 }),
          expect.objectContaining({ page: 2, splitFiltersOffset: OFFSET_PAGE_2 }),
        ])
      })

      it('THEN should skip a collapsed node and fetch its missing page once it is expanded', async () => {
        const { result } = await renderExpandedTree()

        act(() => result.current.toggleNode(rndPath, 'department'))
        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))

        await act(async () => result.current.loadMoreFilterPage())

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([1, 1])

        mockQuery.mockClear()

        act(() => result.current.toggleNode(rndPath, 'department'))
        await waitFor(() =>
          expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([2, 2]),
        )

        expect(getCalls()).toEqual([
          expect.objectContaining({ groupBy: 'team', splitFiltersOffset: OFFSET_PAGE_2 }),
          expect.objectContaining({ groupBy: 'cost_center', splitFiltersOffset: OFFSET_PAGE_2 }),
        ])
      })

      it('THEN should keep the loaded filter pages while a block has not received the new one', async () => {
        const { result } = await renderExpandedTree()

        let resolveTeam: (value: unknown) => void = () => undefined

        mockQuery
          .mockReturnValueOnce(resolveUsage(buildUsage(['rnd'])))
          .mockReturnValueOnce(new Promise((resolve) => (resolveTeam = resolve)))
          .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))

        act(() => {
          result.current.loadMoreFilterPage()
        })

        await waitFor(() =>
          expect(getBlockFilterPagesCounts(result.current.nodes, ROOT_KEY)).toEqual([2]),
        )
        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([1, 2])
        expect(result.current.isLoadingFilterPage).toBe(true)

        await act(async () => resolveTeam({ data: { attributedUsage: buildUsage(['eng']) } }))

        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([2, 2])
        expect(result.current.isLoadingFilterPage).toBe(false)
      })

      it('THEN should not request anything while a node is still loading', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValue(new Promise(() => undefined))
        act(() => result.current.toggleNode(rndPath, 'department'))
        await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(3))
        mockQuery.mockClear()

        await act(async () => result.current.loadMoreFilterPage())

        expect(mockQuery).not.toHaveBeenCalled()
      })
    })

    describe('WHEN loading the next filter page fails', () => {
      it('THEN should toast, roll the filter page back and stay retryable', async () => {
        const { result } = await renderExpandedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))
        mockQuery.mockRejectedValueOnce(new Error('network'))

        await act(async () => result.current.loadMoreFilterPage())

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(result.current.isLoadingFilterPage).toBe(false)
        expect(getBlockFilterPagesCounts(result.current.nodes, ROOT_KEY)).toEqual([1])
        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([1, 1])
      })

      it('THEN should drop the late page of the failed attempt and load a fresh one on retry', async () => {
        const { result } = await renderExpandedTree()

        let resolveStale: (value: unknown) => void = () => undefined

        mockQuery
          .mockRejectedValueOnce(new Error('network'))
          .mockReturnValueOnce(new Promise((resolve) => (resolveStale = resolve)))
          .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))

        act(() => {
          result.current.loadMoreFilterPage()
        })
        await waitFor(() =>
          expect(getBlockFilterPagesCounts(result.current.nodes, ROOT_KEY)).toEqual([1]),
        )
        await act(async () => resolveStale({ data: { attributedUsage: buildUsage(['stale']) } }))

        expect(result.current.isLoadingFilterPage).toBe(false)
        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([1, 1])

        mockQuery
          .mockReturnValueOnce(resolveUsage(buildUsage(['rnd'])))
          .mockReturnValueOnce(resolveUsage(buildUsage(['fresh'])))
          .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))

        await act(async () => result.current.loadMoreFilterPage())

        const rnd = result.current.nodes[RND_KEY]

        expect(rnd?.status === 'loaded' && rnd.blocks[0].usages[1].rows[0].value).toBe('fresh')
      })

      it('THEN should keep a node expanded during the failed attempt on the rolled back count', async () => {
        const { result } = await renderLoadedTree()

        let rejectRootPage: (reason: unknown) => void = () => undefined

        mockQuery.mockReturnValueOnce(new Promise((_, reject) => (rejectRootPage = reject)))
        act(() => {
          result.current.loadMoreFilterPage()
        })
        await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(2))

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['eng'])))
        act(() => result.current.toggleNode(rndPath, 'department'))
        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))
        await act(async () => rejectRootPage(new Error('network')))

        expect(getBlockFilterPagesCounts(result.current.nodes, ROOT_KEY)).toEqual([1])
        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([1, 1])
      })
    })

    describe('WHEN many requests start at once', () => {
      it('THEN should send the first one alone, then at most six in parallel', async () => {
        const manyLevels = Array.from({ length: 8 }, (_, index) => ({
          code: `level_${index}`,
          name: `Level ${index}`,
          isLeaf: true,
        }))
        const resolvers: Array<(value: unknown) => void> = []

        manyLevels.forEach(() =>
          mockQuery.mockReturnValueOnce(new Promise((resolve) => resolvers.push(resolve))),
        )
        renderTree({ getChildLevels: () => manyLevels })

        await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(1))
        await act(async () => resolvers[0]({ data: { attributedUsage: buildUsage([]) } }))

        expect(mockQuery).toHaveBeenCalledTimes(7)

        await act(async () =>
          resolvers.forEach((resolve) => resolve({ data: { attributedUsage: buildUsage([]) } })),
        )
        await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(8))
      })
    })

    describe('WHEN a node is expanded with two filter pages open', () => {
      it('THEN should fire one request per filter page for each level and commit them together', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))
        await act(async () => result.current.loadMoreFilterPage())
        mockQuery.mockClear()

        let resolveLastPage: (value: unknown) => void = () => undefined

        mockQuery
          .mockReturnValueOnce(resolveUsage(buildUsage(['eng'])))
          .mockReturnValueOnce(resolveUsage(buildUsage(['eng'])))
          .mockReturnValueOnce(resolveUsage(buildUsage(['cc-1'])))
          .mockReturnValueOnce(new Promise((resolve) => (resolveLastPage = resolve)))

        act(() => result.current.toggleNode(rndPath, 'department'))

        await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(4))
        expect(result.current.nodes[RND_KEY]).toEqual({ status: 'loading' })
        expect(getCalls()).toEqual([
          expect.objectContaining({ groupBy: 'team', splitFiltersOffset: undefined }),
          expect.objectContaining({ groupBy: 'team', splitFiltersOffset: OFFSET_PAGE_2 }),
          expect.objectContaining({ groupBy: 'cost_center', splitFiltersOffset: undefined }),
          expect.objectContaining({ groupBy: 'cost_center', splitFiltersOffset: OFFSET_PAGE_2 }),
        ])

        await act(async () => resolveLastPage({ data: { attributedUsage: buildUsage(['cc-1']) } }))

        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([2, 2])
      })
    })

    describe('WHEN more rows are loaded with two filter pages open', () => {
      it('THEN should fetch the next row page for each filter page and append it to both', async () => {
        const { result } = await renderLoadedTree()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'], { totalPages: 2 })))
        await act(async () => result.current.loadMoreFilterPage())
        mockQuery.mockClear()
        mockQuery.mockReturnValue(
          resolveUsage(buildUsage(['data'], { currentPage: 2, totalPages: 2 })),
        )

        await act(async () => result.current.loadMore([], 0))

        expect(getCalls()).toEqual([
          expect.objectContaining({ page: 2, splitFiltersOffset: undefined }),
          expect.objectContaining({ page: 2, splitFiltersOffset: OFFSET_PAGE_2 }),
        ])

        const root = result.current.nodes[ROOT_KEY]

        expect(
          root?.status === 'loaded' &&
            root.blocks[0].usages.map(({ rows }) => rows.map(({ value }) => value)),
        ).toEqual([
          ['rnd', 'gtm', 'data'],
          ['rnd', 'data'],
        ])
      })
    })

    describe('WHEN the tree is refreshed with two filter pages open', () => {
      it('THEN should keep both filter pages for every reloaded block', async () => {
        const { result } = await renderTreeWithTwoFilterPages()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))

        await act(async () => result.current.refresh())
        await waitFor(() => expect(result.current.nodes[RND_KEY]?.status).toBe('loaded'))

        expect(mockQuery).toHaveBeenCalledTimes(6)
        expect(getBlockFilterPagesCounts(result.current.nodes, ROOT_KEY)).toEqual([2])
        expect(getBlockFilterPagesCounts(result.current.nodes, RND_KEY)).toEqual([2, 2])
      })
    })

    describe('WHEN the reset key changes with two filter pages open', () => {
      it('THEN should go back to the first filter page', async () => {
        const { result, rerender } = await renderTreeWithTwoFilterPages()

        mockQuery.mockReturnValue(resolveUsage(buildUsage(['rnd'])))
        rerender({ variables, getChildLevels, resetKey: 'key-2', skip: false })
        await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

        expect(mockQuery).toHaveBeenCalledTimes(1)
      })
    })
  })
})
