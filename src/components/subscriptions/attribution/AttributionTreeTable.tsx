import { useMemo } from 'react'

import { useComposableTable } from '~/components/designSystem/ComposableTable'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { AttributionTableView } from './AttributionTableView'
import { AttributionPathStep, getAttributionNodeKey } from './attributionTree'
import { getAttributionRowsChargesUsage } from './buildAttributionColumns'
import {
  ATTRIBUTION_COLUMN_PINNING,
  AttributionTableRow,
  AttributionTableRowModel,
  AttributionTableSharedProps,
  useAttributionTableColumns,
} from './useAttributionTableColumns'
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

export const AttributionTreeTable = ({
  nodes,
  isLoadingFilterPage,
  onToggleNode,
  onLoadMore,
  isLoading,
  ...columnsProps
}: AttributionTreeTableProps): JSX.Element => {
  const { translate } = useInternationalization()

  const tableColumns = useAttributionTableColumns({
    ...columnsProps,
    loadMoreDataTest: ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID,
    toggleDataTest: ATTRIBUTION_TREE_TOGGLE_TEST_ID,
  })

  const rows = useMemo(() => {
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
          fields: Omit<AttributionTableRow, 'id'>,
        ): AttributionTableRowModel => {
          const rowPath = [...path, { code: level.code, value }]
          const id = getAttributionNodeKey(rowPath)

          return {
            ...fields,
            kind: 'data',
            id,
            expansion: level.isLeaf
              ? { canExpand: false }
              : {
                  canExpand: true,
                  isLoading: nodes[id]?.status === 'loading',
                  onToggle: () => onToggleNode(rowPath, level.code),
                },
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
                  isLoading: block.isLoadingMore,
                  isDisabled: isLoadingFilterPage,
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

    return buildRows([], ROOT_NODE_KEY)
  }, [nodes, isLoadingFilterPage, onToggleNode, onLoadMore, translate])

  const expanded = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(nodes)
          .filter(([, node]) => node.status === 'loaded' && node.isExpanded)
          .map(([key]) => [key, true]),
      ),
    [nodes],
  )

  const table = useComposableTable({
    data: rows,
    columns: tableColumns,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.kind === 'data' ? row.subRows : undefined),
    getRowCanExpand: (row) => row.original.kind === 'data' && row.original.expansion.canExpand,
    initialState: { columnPinning: ATTRIBUTION_COLUMN_PINNING },
    state: { expanded },
  })

  return (
    <AttributionTableView
      table={table}
      isLoading={isLoading}
      rowDataTest={ATTRIBUTION_TREE_ROW_TEST_ID}
      data-test={ATTRIBUTION_TREE_TABLE_TEST_ID}
    />
  )
}
