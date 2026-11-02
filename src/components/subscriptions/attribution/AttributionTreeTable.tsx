import { ExpandedState, Updater } from '@tanstack/react-table'
import { useMemo } from 'react'

import { useComposableTable } from '~/components/designSystem/ComposableTable'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  ATTRIBUTION_COLUMN_PINNING,
  AttributionTableRowModel,
  AttributionTableSharedProps,
  AttributionTableView,
  useAttributionTableColumns,
} from './AttributionFlatTable'
import { AttributionPathStep, getAttributionNodeKey } from './attributionTree'
import { getAttributionRowsChargesUsage } from './buildAttributionColumns'
import { AttributionTreeNodes } from './useAttributionTree'

export const ATTRIBUTION_TREE_TABLE_TEST_ID = 'attribution-tree-table'
export const ATTRIBUTION_TREE_ROW_TEST_ID = 'attribution-tree-table-row'
export const ATTRIBUTION_TREE_TOGGLE_TEST_ID = 'attribution-tree-toggle'
export const ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID = 'attribution-tree-load-more-rows'

const ROOT_NODE_KEY = getAttributionNodeKey([])

type AttributionTreeTableProps = AttributionTableSharedProps & {
  nodes: AttributionTreeNodes
  isLoadingFilterPage: boolean
  onToggleNode: (path: AttributionPathStep[], levelCode: string) => void
  onLoadMore: (path: AttributionPathStep[], blockIndex: number) => void
}

type AttributionTreeNodeTarget = { path: AttributionPathStep[]; levelCode: string }

export const AttributionTreeTable = ({
  nodes,
  isLoadingFilterPage,
  onToggleNode,
  onLoadMore,
  isLoading,
  showMoreColumns,
  ...columnsProps
}: AttributionTreeTableProps): JSX.Element => {
  const { translate } = useInternationalization()

  const tableColumns = useAttributionTableColumns({
    ...columnsProps,
    loadMoreDataTest: ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID,
    toggleDataTest: ATTRIBUTION_TREE_TOGGLE_TEST_ID,
  })

  const { rows, targetsById } = useMemo(() => {
    const targets = new Map<string, AttributionTreeNodeTarget>()

    const buildRows = (
      path: AttributionPathStep[],
      nodeKey: string,
    ): AttributionTableRowModel[] => {
      const node = nodes[nodeKey]

      if (node?.status !== 'loaded') return []

      return node.blocks.flatMap((block, blockIndex) => {
        const { level, usages } = block
        const [usage] = usages
        const getRowChargesUsage = getAttributionRowsChargesUsage(usages)

        const toDataRow = (
          value: string | null,
          fields: Pick<
            Extract<AttributionTableRowModel, { kind: 'data' }>,
            | 'typeLabel'
            | 'label'
            | 'isUnattributed'
            | 'amountCents'
            | 'splitChargeUnits'
            | 'chargesUsageByFilterPage'
          >,
        ): AttributionTableRowModel => {
          const rowPath = [...path, { code: level.code, value }]
          const id = getAttributionNodeKey(rowPath)

          targets.set(id, { path: rowPath, levelCode: level.code })

          return {
            ...fields,
            kind: 'data',
            id,
            toggle: level.isLeaf
              ? { kind: 'spacer' }
              : { kind: 'expand', isLoading: nodes[id]?.status === 'loading' },
            subRows: buildRows(rowPath, id),
          }
        }

        const { currentPage, totalPages } = usage.metadata
        const loadMoreRows: AttributionTableRowModel[] =
          currentPage < totalPages
            ? [
                {
                  kind: 'loadMore',
                  id: `${nodeKey}-load-more-${level.code}`,
                  toggle: { kind: 'spacer' },
                  isLoading: block.isLoadingMore || isLoadingFilterPage,
                  onLoadMore: () => onLoadMore(path, blockIndex),
                },
              ]
            : []

        return [
          ...usage.rows.map((row) =>
            toDataRow(row.value, {
              typeLabel: level.name,
              label: row.value,
              isUnattributed: false,
              amountCents: row.amountCents,
              splitChargeUnits: row.splitChargeUnits,
              chargesUsageByFilterPage: getRowChargesUsage(row.value),
            }),
          ),
          ...loadMoreRows,
          toDataRow(null, {
            typeLabel: translate('text_1792668632007lqi5wcqidcx'),
            label: translate('text_1792668632007qgsxnaul7fn', { typeName: level.name }),
            isUnattributed: true,
            amountCents: usage.unattributed.amountCents,
            splitChargeUnits: usage.unattributed.splitChargeUnits,
            chargesUsageByFilterPage: usages.map(({ unattributed }) => unattributed.chargesUsage),
          }),
        ]
      })
    }

    return { rows: buildRows([], ROOT_NODE_KEY), targetsById: targets }
  }, [nodes, isLoadingFilterPage, onLoadMore, translate])

  const expanded = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(nodes)
          .filter(([, node]) => node.status === 'loaded' && node.isExpanded)
          .map(([key]) => [key, true]),
      ),
    [nodes],
  )

  const handleExpandedChange = (updater: Updater<ExpandedState>): void => {
    const next = typeof updater === 'function' ? updater(expanded) : updater

    if (next === true) return

    const changedId = [...new Set([...Object.keys(expanded), ...Object.keys(next)])].find(
      (id) => !!expanded[id] !== !!next[id],
    )
    const target = changedId ? targetsById.get(changedId) : undefined

    if (target) onToggleNode(target.path, target.levelCode)
  }

  const table = useComposableTable({
    data: rows,
    columns: tableColumns,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.kind === 'data' ? row.subRows : undefined),
    getRowCanExpand: (row) => row.original.kind === 'data' && row.original.toggle.kind === 'expand',
    initialState: { columnPinning: ATTRIBUTION_COLUMN_PINNING },
    state: { expanded },
    onExpandedChange: handleExpandedChange,
  })

  return (
    <AttributionTableView
      table={table}
      isLoading={isLoading}
      showMoreColumns={showMoreColumns}
      rowDataTest={ATTRIBUTION_TREE_ROW_TEST_ID}
      data-test={ATTRIBUTION_TREE_TABLE_TEST_ID}
    />
  )
}
