import { ApolloError, useApolloClient } from '@apollo/client'
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
  collapseFilterPages: () => void
  refresh: () => void
}

type LoadNodeOptions = {
  isExpanded?: boolean
  pageCountByLevelCode?: Record<string, number>
}

// `errorLink` in `init.ts` already toasts GraphQL errors, only the rest is ours to report.
export const notifyAttributionError = (error: unknown): void => {
  if (error instanceof ApolloError && error.graphQLErrors.length) return

  addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })
}

const isAttributionNodeBusy = (node: AttributionTreeNode): boolean =>
  node.status === 'loading' ||
  (node.status === 'loaded' && node.blocks.some(({ isLoadingMore }) => isLoadingMore))

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
    ): Promise<AttributionTreeUsage> => {
      const latestVariables = latestParamsRef.current.variables
      const filters = mergeAttributionFilters(
        latestVariables.filters ?? [],
        buildAttributionFilters(path),
      )

      const { data } = await client.query<
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
        fetchPolicy: 'no-cache',
      })

      return data.attributedUsage
    },
    [client],
  )

  const fetchUsagePages = useCallback(
    async (
      level: AttributionLevel,
      path: AttributionPathStep[],
      pageCount: number,
      filterPage: number,
    ): Promise<AttributionTreeUsage> => {
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, index) =>
          fetchUsage(level, path, index + 1, filterPage),
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
    ): Promise<AttributionTreeUsage[]> =>
      Promise.all(
        Array.from({ length: filterPagesCountRef.current }, (_, filterPage) =>
          fetchUsagePages(level, path, pageCount, filterPage),
        ),
      ),
    [fetchUsagePages],
  )

  const loadNode = useCallback(
    async (
      path: AttributionPathStep[],
      parentCode: string | null,
      { isExpanded = true, pageCountByLevelCode }: LoadNodeOptions = {},
    ): Promise<void> => {
      const key = getAttributionNodeKey(path)
      const generation = generationRef.current
      const levels = latestParamsRef.current.getChildLevels(parentCode)

      updateNodes((previous) => ({ ...previous, [key]: { status: 'loading' } }))

      try {
        const usages = await Promise.all(
          levels.map((level) =>
            fetchUsageFilterPages(level, path, pageCountByLevelCode?.[level.code] ?? 1),
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
              usages: usages[index],
              isLoadingMore: false,
            })),
          },
        }))
      } catch (error) {
        if (generation !== generationRef.current) return

        updateNodes((previous) => ({ ...previous, [key]: { status: 'error', error } }))
        notifyAttributionError(error)
      }
    },
    [fetchUsageFilterPages, updateNodes],
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

        return
      }

      loadNode(path, levelCode)
    },
    [loadNode, updateNodes],
  )

  const loadMore = useCallback(
    async (path: AttributionPathStep[], blockIndex: number): Promise<void> => {
      const key = getAttributionNodeKey(path)
      const node = nodesRef.current[key]
      const block = node?.status === 'loaded' ? node.blocks[blockIndex] : undefined

      if (!block || block.isLoadingMore || isLoadingFilterPageRef.current) return

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

  const dropFilterPages = useCallback(
    (count: number): void => {
      filterPagesCountRef.current = count
      updateNodes((previous) =>
        Object.fromEntries(
          Object.entries(previous).map(([key, node]) => [
            key,
            node.status === 'loaded'
              ? {
                  ...node,
                  blocks: node.blocks.map((block) => ({
                    ...block,
                    usages: block.usages.slice(0, count),
                  })),
                }
              : node,
          ]),
        ),
      )
    },
    [updateNodes],
  )

  const loadMoreFilterPage = useCallback(async (): Promise<void> => {
    const previousNodes = nodesRef.current

    if (isLoadingFilterPageRef.current || isAttributionTreeBusy(previousNodes)) return

    const generation = generationRef.current
    const filterPage = filterPagesCountRef.current

    updateIsLoadingFilterPage(true)
    filterPagesCountRef.current = filterPage + 1

    try {
      await Promise.all(
        Object.entries(previousNodes).flatMap(([key, node]) => {
          const path = parseAttributionNodeKey(key)

          if (node.status !== 'loaded') return []

          return node.blocks.map(async (block, blockIndex) => {
            const usage = await fetchUsagePages(
              block.level,
              path,
              block.usages[0].metadata.currentPage,
              filterPage,
            )

            if (generation !== generationRef.current) return

            updateBlock(key, blockIndex, (previous) => {
              if (
                previous.usages.length !== filterPage ||
                filterPagesCountRef.current <= filterPage
              ) {
                return previous
              }

              return { ...previous, usages: [...previous.usages, usage] }
            })
          })
        }),
      )
    } catch (error) {
      if (generation !== generationRef.current) return

      dropFilterPages(filterPage)
      notifyAttributionError(error)
    }

    if (generation !== generationRef.current) return

    updateIsLoadingFilterPage(false)
  }, [dropFilterPages, fetchUsagePages, updateBlock, updateIsLoadingFilterPage])

  const collapseFilterPages = useCallback((): void => {
    if (isLoadingFilterPageRef.current || isAttributionTreeBusy(nodesRef.current)) return

    dropFilterPages(1)
  }, [dropFilterPages])

  const reset = useCallback((): void => {
    generationRef.current += 1
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
      .filter(([key, node]) => key !== rootKey && node.status === 'loaded' && node.isExpanded)
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
    collapseFilterPages,
    refresh,
  }
}
