import { ApolloError, FetchPolicy, useApolloClient } from '@apollo/client'
import { useCallback, useEffect, useRef, useState } from 'react'

import { addToast } from '~/core/apolloClient'
import {
  AttributedUsageFilterInput,
  GetSubscriptionAttributedUsageDocument,
  GetSubscriptionAttributedUsageQuery,
  GetSubscriptionAttributedUsageQueryVariables,
} from '~/generated/graphql'

import {
  AttributionLevel,
  AttributionPathStep,
  buildAttributionFilters,
  getAttributionNodeKey,
  mergeAttributionFilters,
  parseAttributionNodeKey,
} from './attributionTree'
import { SPLIT_FILTERS_PER_PAGE } from './buildAttributionColumns'

export type AttributionTreeUsage = GetSubscriptionAttributedUsageQuery['attributedUsage']

export type AttributionTreeBlock = {
  level: AttributionLevel
  usages: AttributionTreeUsage[]
  isLoadingMore: boolean
  isLoadingFilterPages: boolean
}

type AttributionTreeNode =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'loaded'; isExpanded: boolean; blocks: AttributionTreeBlock[] }

export type AttributionTreeNodes = Record<string, AttributionTreeNode>

type AttributionTreeVariables = Omit<
  GetSubscriptionAttributedUsageQueryVariables,
  'groupBy' | 'filters' | 'page' | 'splitFiltersOffset'
> & { filters?: AttributedUsageFilterInput[] }

type UseAttributionTreeParams = {
  variables: AttributionTreeVariables
  getChildLevels: (parentCode: string | null) => AttributionLevel[]
  resetKey: string
  skip: boolean
}

type UseAttributionTreeReturn = {
  nodes: AttributionTreeNodes
  isLoadingFilterPage: boolean
  toggleNode: (path: AttributionPathStep[], levelCode: string) => void
  loadMore: (path: AttributionPathStep[], blockIndex: number) => void
  loadMoreFilterPage: () => void
  refresh: () => void
}

const MAX_CONCURRENT_REQUESTS = 6

type RequestQueue = <T>(task: () => Promise<T>) => Promise<T>

type LoadNodeOptions = {
  isExpanded?: boolean
  pageCountByLevelCode?: Record<string, number>
}

// `errorLink` in `init.ts` already toasts GraphQL errors, only the rest is ours to report.
export const notifyAttributionError = (error: unknown): void => {
  if (error instanceof ApolloError && error.graphQLErrors.length) return

  addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })
}

const createRequestQueue = (limit: number): RequestQueue => {
  let activeCount = 0
  const waiting: Array<() => void> = []

  const acquire = (): Promise<void> => {
    if (activeCount < limit) {
      activeCount += 1

      return Promise.resolve()
    }

    return new Promise((resolve) => waiting.push(resolve))
  }

  const release = (): void => {
    const next = waiting.shift()

    if (next) {
      next()
    } else {
      activeCount -= 1
    }
  }

  return async (task) => {
    await acquire()

    try {
      return await task()
    } finally {
      release()
    }
  }
}

const isAttributionNodeBusy = (node: AttributionTreeNode): boolean =>
  node.status === 'loading' ||
  (node.status === 'loaded' &&
    node.blocks.some(
      ({ isLoadingMore, isLoadingFilterPages }) => isLoadingMore || isLoadingFilterPages,
    ))

const isAttributionNodeVisible = (
  nodes: AttributionTreeNodes,
  path: AttributionPathStep[],
): boolean =>
  Array.from(
    { length: path.length + 1 },
    (_, depth) => nodes[getAttributionNodeKey(path.slice(0, depth))],
  ).every((node) => node?.status === 'loaded' && node.isExpanded)

export const isAttributionTreeBusy = (nodes: AttributionTreeNodes): boolean =>
  Object.values(nodes).some(isAttributionNodeBusy)

export const useAttributionTree = ({
  variables,
  getChildLevels,
  resetKey,
  skip,
}: UseAttributionTreeParams): UseAttributionTreeReturn => {
  const client = useApolloClient()
  const [nodes, setNodes] = useState<AttributionTreeNodes>({})
  const nodesRef = useRef<AttributionTreeNodes>({})
  const generationRef = useRef(0)
  const filterPagesCountRef = useRef(1)
  const fetchPolicyRef = useRef<FetchPolicy>('cache-first')
  const [enqueueRequest] = useState(() => createRequestQueue(MAX_CONCURRENT_REQUESTS))
  const isLoadingFilterPageRef = useRef(false)
  const [isLoadingFilterPage, setIsLoadingFilterPage] = useState(false)
  const latestParamsRef = useRef({ variables, getChildLevels, skip })

  useEffect(() => {
    latestParamsRef.current = { variables, getChildLevels, skip }
  })

  const updateNodes = useCallback(
    (update: (previous: AttributionTreeNodes) => AttributionTreeNodes): void => {
      nodesRef.current = update(nodesRef.current)
      setNodes(nodesRef.current)
    },
    [],
  )

  const updateIsLoadingFilterPage = useCallback((isLoading: boolean): void => {
    isLoadingFilterPageRef.current = isLoading
    setIsLoadingFilterPage(isLoading)
  }, [])

  const updateBlock = useCallback(
    (
      key: string,
      blockIndex: number,
      update: (block: AttributionTreeBlock) => AttributionTreeBlock,
    ): void => {
      updateNodes((previous) => {
        const node = previous[key]

        if (node?.status !== 'loaded') return previous

        return {
          ...previous,
          [key]: {
            ...node,
            blocks: node.blocks.map((block, index) =>
              index === blockIndex ? update(block) : block,
            ),
          },
        }
      })
    },
    [updateNodes],
  )

  const fetchUsage = useCallback(
    async (
      level: AttributionLevel,
      path: AttributionPathStep[],
      page: number,
      filterPage: number,
      silentError = false,
    ): Promise<AttributionTreeUsage> => {
      const latestVariables = latestParamsRef.current.variables
      const filters = mergeAttributionFilters(
        latestVariables.filters ?? [],
        buildAttributionFilters(path),
      )

      const { data } = await enqueueRequest(() =>
        client.query<
          GetSubscriptionAttributedUsageQuery,
          GetSubscriptionAttributedUsageQueryVariables
        >({
          query: GetSubscriptionAttributedUsageDocument,
          variables: {
            ...latestVariables,
            groupBy: level.code,
            filters: filters.length ? filters : undefined,
            page,
            splitFiltersOffset: filterPage ? filterPage * SPLIT_FILTERS_PER_PAGE : undefined,
          },
          fetchPolicy: fetchPolicyRef.current,
          context: { silentError },
        }),
      )

      return data.attributedUsage
    },
    [client, enqueueRequest],
  )

  const fetchUsagePages = useCallback(
    async (
      level: AttributionLevel,
      path: AttributionPathStep[],
      pageCount: number,
      filterPage: number,
      silentError = false,
    ): Promise<AttributionTreeUsage> => {
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, index) =>
          fetchUsage(level, path, index + 1, filterPage, silentError),
        ),
      )

      return { ...pages[pages.length - 1], rows: pages.flatMap(({ rows }) => rows) }
    },
    [fetchUsage],
  )

  const fetchUsageFilterPages = useCallback(
    (
      level: AttributionLevel,
      path: AttributionPathStep[],
      pageCount: number,
      silentError: boolean,
    ): Promise<AttributionTreeUsage[]> =>
      Promise.all(
        Array.from({ length: filterPagesCountRef.current }, (_, filterPage) =>
          fetchUsagePages(level, path, pageCount, filterPage, silentError),
        ),
      ),
    [fetchUsagePages],
  )

  const dropFilterPages = useCallback(
    (count: number): void => {
      filterPagesCountRef.current = Math.min(filterPagesCountRef.current, count)
      updateNodes((previous) =>
        Object.fromEntries(
          Object.entries(previous).map(([key, node]) => [
            key,
            node.status === 'loaded'
              ? {
                  ...node,
                  blocks: node.blocks.map((block) => ({
                    ...block,
                    usages: block.usages.slice(0, filterPagesCountRef.current),
                  })),
                }
              : node,
          ]),
        ),
      )
    },
    [updateNodes],
  )

  const fillFilterPages = useCallback(
    async (key: string): Promise<void> => {
      const node = nodesRef.current[key]
      const path = parseAttributionNodeKey(key)

      if (node?.status !== 'loaded' || !isAttributionNodeVisible(nodesRef.current, path)) return

      const generation = generationRef.current

      await Promise.all(
        node.blocks.map(async (block, blockIndex) => {
          const loadedCount = block.usages.length
          const targetCount = filterPagesCountRef.current

          if (block.isLoadingMore || block.isLoadingFilterPages || loadedCount >= targetCount) {
            return
          }

          updateBlock(key, blockIndex, (previous) => ({ ...previous, isLoadingFilterPages: true }))

          try {
            const usages = await Promise.all(
              Array.from({ length: targetCount - loadedCount }, (_, index) =>
                fetchUsagePages(
                  block.level,
                  path,
                  block.usages[0].metadata.currentPage,
                  loadedCount + index,
                ),
              ),
            )

            if (generation !== generationRef.current) return

            updateBlock(key, blockIndex, (previous) => ({
              ...previous,
              isLoadingFilterPages: false,
              usages:
                previous.usages.length === loadedCount
                  ? [...previous.usages, ...usages].slice(0, filterPagesCountRef.current)
                  : previous.usages,
            }))
          } catch (error) {
            if (generation !== generationRef.current) return

            updateBlock(key, blockIndex, (previous) => ({
              ...previous,
              isLoadingFilterPages: false,
            }))

            if (loadedCount >= filterPagesCountRef.current) return

            dropFilterPages(loadedCount)
            notifyAttributionError(error)
          }
        }),
      )
    },
    [dropFilterPages, fetchUsagePages, updateBlock],
  )

  const fillVisibleFilterPages = useCallback(async (): Promise<void> => {
    await Promise.all(Object.keys(nodesRef.current).map((key) => fillFilterPages(key)))
  }, [fillFilterPages])

  const loadNode = useCallback(
    async (
      path: AttributionPathStep[],
      parentCode: string | null,
      { isExpanded = true, pageCountByLevelCode }: LoadNodeOptions = {},
    ): Promise<void> => {
      const key = getAttributionNodeKey(path)
      const generation = generationRef.current
      const levels = latestParamsRef.current.getChildLevels(parentCode)
      // A failed root renders the tab's error placeholder, so only nested levels toast.
      const isRoot = !path.length

      updateNodes((previous) => ({ ...previous, [key]: { status: 'loading' } }))

      try {
        const usages = await Promise.all(
          levels.map((level) =>
            fetchUsageFilterPages(level, path, pageCountByLevelCode?.[level.code] ?? 1, isRoot),
          ),
        )

        if (generation !== generationRef.current) return

        updateNodes((previous) => ({
          ...previous,
          [key]: {
            status: 'loaded',
            isExpanded,
            blocks: levels.map((level, index) => ({
              level,
              usages: usages[index].slice(0, filterPagesCountRef.current),
              isLoadingMore: false,
              isLoadingFilterPages: false,
            })),
          },
        }))

        fillFilterPages(key)
      } catch (error) {
        if (generation !== generationRef.current) return

        updateNodes((previous) => ({ ...previous, [key]: { status: 'error', error } }))

        if (!isRoot) notifyAttributionError(error)
      }
    },
    [fetchUsageFilterPages, fillFilterPages, updateNodes],
  )

  const toggleNode = useCallback(
    (path: AttributionPathStep[], levelCode: string): void => {
      const key = getAttributionNodeKey(path)
      const node = nodesRef.current[key]

      if (node?.status === 'loading') return

      if (node?.status === 'loaded') {
        updateNodes((previous) => ({
          ...previous,
          [key]: { ...node, isExpanded: !node.isExpanded },
        }))

        if (!node.isExpanded) fillVisibleFilterPages()

        return
      }

      loadNode(path, levelCode)
    },
    [fillVisibleFilterPages, loadNode, updateNodes],
  )

  const loadMore = useCallback(
    async (path: AttributionPathStep[], blockIndex: number): Promise<void> => {
      const key = getAttributionNodeKey(path)
      const node = nodesRef.current[key]
      const block = node?.status === 'loaded' ? node.blocks[blockIndex] : undefined

      if (!block || block.isLoadingMore || block.isLoadingFilterPages) return

      const generation = generationRef.current
      const nextPage = block.usages[0].metadata.currentPage + 1

      updateBlock(key, blockIndex, (previous) => ({ ...previous, isLoadingMore: true }))

      try {
        const usages = await Promise.all(
          block.usages.map((_, filterPage) => fetchUsage(block.level, path, nextPage, filterPage)),
        )

        if (generation !== generationRef.current) return

        updateBlock(key, blockIndex, (previous) => ({
          ...previous,
          isLoadingMore: false,
          usages: previous.usages.map((previousUsage, filterPage) => ({
            ...previousUsage,
            metadata: usages[filterPage].metadata,
            rows: [...previousUsage.rows, ...usages[filterPage].rows],
          })),
        }))
      } catch (error) {
        if (generation !== generationRef.current) return

        updateBlock(key, blockIndex, (previous) => ({ ...previous, isLoadingMore: false }))
        notifyAttributionError(error)
      }
    },
    [fetchUsage, updateBlock],
  )

  const loadMoreFilterPage = useCallback(async (): Promise<void> => {
    if (isLoadingFilterPageRef.current || isAttributionTreeBusy(nodesRef.current)) return

    const generation = generationRef.current

    updateIsLoadingFilterPage(true)
    filterPagesCountRef.current += 1

    await fillVisibleFilterPages()

    if (generation !== generationRef.current) return

    updateIsLoadingFilterPage(false)
  }, [fillVisibleFilterPages, updateIsLoadingFilterPage])

  const reset = useCallback((): void => {
    generationRef.current += 1
    fetchPolicyRef.current = 'cache-first'
    updateIsLoadingFilterPage(false)
    filterPagesCountRef.current = 1
    updateNodes(() => ({}))

    if (latestParamsRef.current.skip) return

    loadNode([], null)
  }, [loadNode, updateIsLoadingFilterPage, updateNodes])

  const refresh = useCallback((): void => {
    const previousNodes = nodesRef.current
    const rootKey = getAttributionNodeKey([])

    generationRef.current += 1
    fetchPolicyRef.current = 'network-only'
    updateIsLoadingFilterPage(false)
    updateNodes(() => ({}))

    if (latestParamsRef.current.skip) return

    const reloadNode = (key: string): void => {
      const node = previousNodes[key]
      const path = parseAttributionNodeKey(key)
      const parentCode = path.at(-1)?.code ?? null

      if (node?.status !== 'loaded') {
        loadNode(path, parentCode)

        return
      }

      loadNode(path, parentCode, {
        isExpanded: node.isExpanded,
        pageCountByLevelCode: Object.fromEntries(
          node.blocks.map(({ level, usages }) => [level.code, usages[0].metadata.currentPage]),
        ),
      })
    }

    reloadNode(rootKey)

    Object.entries(previousNodes)
      .filter(
        ([key]) =>
          key !== rootKey && isAttributionNodeVisible(previousNodes, parseAttributionNodeKey(key)),
      )
      .forEach(([key]) => reloadNode(key))
  }, [loadNode, updateIsLoadingFilterPage, updateNodes])

  useEffect(() => {
    reset()
  }, [resetKey, skip, reset])

  return {
    nodes,
    isLoadingFilterPage,
    toggleNode,
    loadMore,
    loadMoreFilterPage,
    refresh,
  }
}
