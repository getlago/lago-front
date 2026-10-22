import { ApolloError, useApolloClient } from '@apollo/client'
import { useCallback, useEffect, useRef, useState } from 'react'

import { addToast } from '~/core/apolloClient'
import {
  GetSubscriptionAttributedUsageDocument,
  GetSubscriptionAttributedUsageQuery,
  GetSubscriptionAttributedUsageQueryVariables,
} from '~/generated/graphql'

import {
  AttributionLevel,
  AttributionPathStep,
  buildAttributionFilters,
  getAttributionNodeKey,
} from './attributionTree'

export type AttributionTreeUsage = GetSubscriptionAttributedUsageQuery['attributedUsage']

export type AttributionTreeBlock = {
  level: AttributionLevel
  usage: AttributionTreeUsage
  isLoadingMore: boolean
}

type AttributionTreeNode =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; isExpanded: boolean; blocks: AttributionTreeBlock[] }

export type AttributionTreeNodes = Record<string, AttributionTreeNode>

type AttributionTreeVariables = Omit<
  GetSubscriptionAttributedUsageQueryVariables,
  'groupBy' | 'filters' | 'page'
>

type UseAttributionTreeParams = {
  variables: AttributionTreeVariables
  getChildLevels: (parentCode: string | null) => AttributionLevel[]
  resetKey: string
  skip: boolean
}

type UseAttributionTreeReturn = {
  nodes: AttributionTreeNodes
  toggleNode: (path: AttributionPathStep[], levelCode: string) => void
  loadMore: (path: AttributionPathStep[], blockIndex: number) => void
  reset: () => void
}

const notifyError = (error: unknown): void => {
  if (error instanceof ApolloError && error.graphQLErrors.length) return

  addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })
}

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
  const latestParamsRef = useRef({ variables, getChildLevels, skip })

  latestParamsRef.current = { variables, getChildLevels, skip }

  const updateNodes = useCallback(
    (update: (previous: AttributionTreeNodes) => AttributionTreeNodes): void => {
      nodesRef.current = update(nodesRef.current)
      setNodes(nodesRef.current)
    },
    [],
  )

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
    ): Promise<AttributionTreeUsage> => {
      const { data } = await client.query<
        GetSubscriptionAttributedUsageQuery,
        GetSubscriptionAttributedUsageQueryVariables
      >({
        query: GetSubscriptionAttributedUsageDocument,
        variables: {
          ...latestParamsRef.current.variables,
          groupBy: level.code,
          filters: path.length ? buildAttributionFilters(path) : undefined,
          page,
        },
        fetchPolicy: 'no-cache',
      })

      return data.attributedUsage
    },
    [client],
  )

  const loadNode = useCallback(
    async (path: AttributionPathStep[], parentCode: string | null): Promise<void> => {
      const key = getAttributionNodeKey(path)
      const generation = generationRef.current
      const levels = latestParamsRef.current.getChildLevels(parentCode)

      updateNodes((previous) => ({ ...previous, [key]: { status: 'loading' } }))

      try {
        const usages = await Promise.all(levels.map((level) => fetchUsage(level, path, 1)))

        if (generation !== generationRef.current) return

        updateNodes((previous) => ({
          ...previous,
          [key]: {
            status: 'loaded',
            isExpanded: true,
            blocks: levels.map((level, index) => ({
              level,
              usage: usages[index],
              isLoadingMore: false,
            })),
          },
        }))
      } catch (error) {
        if (generation !== generationRef.current) return

        updateNodes((previous) => ({ ...previous, [key]: { status: 'error' } }))
        notifyError(error)
      }
    },
    [fetchUsage, updateNodes],
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

      if (!block || block.isLoadingMore) return

      const generation = generationRef.current

      updateBlock(key, blockIndex, (previous) => ({ ...previous, isLoadingMore: true }))

      try {
        const usage = await fetchUsage(block.level, path, block.usage.metadata.currentPage + 1)

        if (generation !== generationRef.current) return

        updateBlock(key, blockIndex, (previous) => ({
          ...previous,
          isLoadingMore: false,
          usage: {
            ...previous.usage,
            metadata: usage.metadata,
            rows: [...previous.usage.rows, ...usage.rows],
          },
        }))
      } catch (error) {
        if (generation !== generationRef.current) return

        updateBlock(key, blockIndex, (previous) => ({ ...previous, isLoadingMore: false }))
        notifyError(error)
      }
    },
    [fetchUsage, updateBlock],
  )

  const reset = useCallback((): void => {
    generationRef.current += 1
    updateNodes(() => ({}))

    if (latestParamsRef.current.skip) return

    loadNode([], null)
  }, [loadNode, updateNodes])

  useEffect(() => {
    reset()
  }, [resetKey, skip, reset])

  return { nodes, toggleNode, loadMore, reset }
}
