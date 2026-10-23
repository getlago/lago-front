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

const variables = {
  subscriptionId: 'subscription-1',
  basis: AttributedUsageBasisEnum.Units,
  limit: 50,
}

const ROOT_KEY = getAttributionNodeKey([])
const rndPath: AttributionPathStep[] = [{ code: 'department', value: 'rnd' }]
const RND_KEY = getAttributionNodeKey(rndPath)

const buildUsage = (
  values: string[],
  { currentPage = 1, totalPages = 1 }: { currentPage?: number; totalPages?: number } = {},
): AttributionTreeUsage => ({
  currency: CurrencyEnum.Usd,
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

const renderLoadedTree = async () => {
  mockQuery.mockReturnValueOnce(resolveUsage(buildUsage(['rnd', 'gtm'])))

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
    it('THEN should load the root levels without filters', async () => {
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
          node?.status === 'loaded' && node.blocks[0].usage.rows.map(({ value }) => value),
        ).toEqual(['eng', 'data'])
        expect(node?.status === 'loaded' && node.blocks[0].usage.metadata.currentPage).toBe(2)
        expect(node?.status === 'loaded' && node.blocks[1].usage.rows).toHaveLength(1)
        expect(root?.status === 'loaded' && root.blocks[0].usage.rows).toHaveLength(2)
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

        expect(result.current.nodes[RND_KEY]).toEqual({ status: 'error' })
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
        root?.status === 'loaded' && root.blocks[0].usage.rows.map(({ value }) => value),
      ).toEqual(['rnd', 'gtm', 'data'])
      expect(root?.status === 'loaded' && root.blocks[0].usage.metadata.currentPage).toBe(2)
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

      rerender({ variables, getChildLevels, resetKey: 'key-2', skip: false })
      await waitFor(() => expect(result.current.nodes[ROOT_KEY]?.status).toBe('loaded'))

      await act(async () => resolveStale({ data: { attributedUsage: buildUsage(['eng']) } }))

      expect(result.current.nodes[RND_KEY]).toBeUndefined()
    })
  })
})
