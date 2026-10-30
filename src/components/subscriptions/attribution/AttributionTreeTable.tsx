import { ExpandedState, Updater } from '@tanstack/react-table'
import { ReactNode, useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import {
  ComposableTableExpandToggle,
  ComposableTableLoadMore,
  ComposableTableTreeCell,
  ComposableTableView,
  createComposableTableColumnHelper,
  useComposableTable,
} from '~/components/designSystem/ComposableTable'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { AttributedUsageBasisEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  ATTRIBUTION_LOADING_CELL_TEST_ID,
  ATTRIBUTION_SHOW_MORE_TEST_ID,
  ATTRIBUTION_TABLE_FOOTER_TEST_ID,
  AttributionTableRow,
  AttributionTableSharedProps,
} from './AttributionFlatTable'
import { AttributionLevel, AttributionPathStep, getAttributionNodeKey } from './attributionTree'
import {
  AttributionColumn,
  getAttributionCellUsage,
  getAttributionDisplayedValue,
  getAttributionRowsChargesUsage,
  getAttributionTotalUsage,
} from './buildAttributionColumns'
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

type AttributionUsage = Pick<
  AttributionTableRow,
  'amountCents' | 'splitChargeUnits' | 'chargesUsageByFilterPage'
>

type AttributionTreeRow =
  | (AttributionUsage &
      Pick<AttributionTableRow, 'typeLabel' | 'label' | 'isUnattributed'> & {
        kind: 'data'
        id: string
        path: AttributionPathStep[]
        level: AttributionLevel
        subRows: AttributionTreeRow[]
      })
  | {
      kind: 'loadMore'
      id: string
      path: AttributionPathStep[]
      blockIndex: number
      isLoading: boolean
    }

const columnHelper = createComposableTableColumnHelper<AttributionTreeRow>()

const VALUE_COLUMN_META = { align: 'right', shrink: true, className: 'min-w-24' } as const

export const AttributionTreeTable = ({
  nodes,
  isLoadingFilterPage,
  onToggleNode,
  onLoadMore,
  totals,
  columns,
  chargeLabel,
  showMoreColumns,
  basis,
  currency,
  isLoading,
}: AttributionTreeTableProps): JSX.Element => {
  const { translate } = useInternationalization()

  const { rows, rowsById } = useMemo(() => {
    const byId = new Map<string, AttributionTreeRow>()

    const buildRows = (path: AttributionPathStep[], nodeKey: string): AttributionTreeRow[] => {
      const node = nodes[nodeKey]

      if (node?.status !== 'loaded') return []

      return node.blocks.flatMap((block, blockIndex) => {
        const { level, usages } = block
        const [usage] = usages
        const getRowChargesUsage = getAttributionRowsChargesUsage(usages)

        const toDataRow = (
          value: string | null,
          fields: Omit<
            Extract<AttributionTreeRow, { kind: 'data' }>,
            'kind' | 'id' | 'path' | 'level' | 'subRows'
          >,
        ): AttributionTreeRow => {
          const rowPath = [...path, { code: level.code, value }]
          const id = getAttributionNodeKey(rowPath)
          const row: AttributionTreeRow = {
            kind: 'data',
            id,
            path: rowPath,
            level,
            subRows: buildRows(rowPath, id),
            ...fields,
          }

          byId.set(id, row)

          return row
        }

        const { currentPage, totalPages } = usage.metadata
        const loadMoreRows: AttributionTreeRow[] =
          currentPage < totalPages
            ? [
                {
                  kind: 'loadMore',
                  id: `${nodeKey}-load-more-${level.code}`,
                  path,
                  blockIndex,
                  isLoading: block.isLoadingMore || isLoadingFilterPage,
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

    return { rows: buildRows([], ROOT_NODE_KEY), rowsById: byId }
  }, [nodes, isLoadingFilterPage, translate])

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
    const row = changedId ? rowsById.get(changedId) : undefined

    if (row?.kind === 'data') onToggleNode(row.path, row.level.code)
  }

  const tableColumns = useMemo(() => {
    const formatValue = (value: number | null): string => {
      if (value === null) return '—'

      if (basis === AttributedUsageBasisEnum.Amount) {
        return intlFormatNumber(deserializeAmount(value, currency), { currency })
      }

      return `${intlFormatNumber(value, { style: 'decimal' })} ${translate('text_6282085b4f283b0102655884')}`
    }

    const renderValue = (value: number | null): ReactNode => (
      <Typography variant="body" color="grey700" noWrap>
        {formatValue(value)}
      </Typography>
    )

    const renderCellValue = (usage: AttributionUsage, column: AttributionColumn): ReactNode => {
      const chargesUsage = usage.chargesUsageByFilterPage[column.filterPage]

      if (!chargesUsage) {
        return (
          <span data-test={ATTRIBUTION_LOADING_CELL_TEST_ID}>
            <Skeleton variant="text" className="ml-auto w-16" />
          </span>
        )
      }

      return renderValue(
        getAttributionDisplayedValue({
          basis,
          usage: getAttributionCellUsage(chargesUsage, column),
        }),
      )
    }

    const renderTotalValue = (usage: AttributionUsage): ReactNode =>
      renderValue(
        getAttributionDisplayedValue({
          basis,
          usage: getAttributionTotalUsage({
            amountCents: usage.amountCents,
            splitChargeUnits: usage.splitChargeUnits,
            chargesUsage: usage.chargesUsageByFilterPage[0] ?? [],
          }),
        }),
      )

    const renderHeaderLabel = (label: string | null): ReactNode => (
      <Typography variant="captionHl" color="grey600" noWrap>
        {label}
      </Typography>
    )

    const entityColumn = columnHelper.display({
      id: 'entity',
      header: () => renderHeaderLabel(translate('text_1792668632006w5a1kxhzpz2')),
      footer: () => (
        <Typography variant="body" color="grey600">
          {translate('text_1738063764295zomiafl8b4s')}
        </Typography>
      ),
      cell: ({ row }) => {
        const { original } = row

        if (original.kind === 'loadMore') {
          return (
            <ComposableTableTreeCell depth={row.depth}>
              <ComposableTableLoadMore
                label={translate('text_1792668632007fulz8omi190')}
                isLoading={original.isLoading}
                onLoadMore={() => onLoadMore(original.path, original.blockIndex)}
                data-test={ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID}
              />
            </ComposableTableTreeCell>
          )
        }

        const toggle = row.getCanExpand() ? (
          <ComposableTableExpandToggle
            label={original.label}
            isExpanded={row.getIsExpanded()}
            isLoading={nodes[original.id]?.status === 'loading'}
            onToggle={row.getToggleExpandedHandler()}
            data-test={ATTRIBUTION_TREE_TOGGLE_TEST_ID}
          />
        ) : undefined

        return (
          <ComposableTableTreeCell depth={row.depth} toggle={toggle}>
            <Chip label={original.typeLabel} variant="captionCode" size="small" />
            <Typography
              variant="body"
              color={original.isUnattributed ? 'grey600' : 'grey700'}
              noWrap
            >
              {original.label}
            </Typography>
          </ComposableTableTreeCell>
        )
      },
    })

    const valueColumns = columns.map((column) =>
      columnHelper.display({
        id: column.key,
        meta: VALUE_COLUMN_META,
        header: () => renderHeaderLabel(column.label ?? translate('text_65281f686a80b400c8e2f6d1')),
        footer: () => renderCellValue(totals, column),
        cell: ({ row }) =>
          row.original.kind === 'data' ? renderCellValue(row.original, column) : null,
      }),
    )

    const chargesColumn = columnHelper.group({
      id: 'charges',
      header: () => (
        <div className="flex items-center justify-between gap-4">
          {renderHeaderLabel(chargeLabel)}
          {showMoreColumns && (
            <Button
              variant="inline"
              size="small"
              loading={showMoreColumns.isExpanded && showMoreColumns.isLoading}
              disabled={
                showMoreColumns.isExpanded &&
                (showMoreColumns.isLoading || showMoreColumns.isDisabled)
              }
              onClick={showMoreColumns.onClick}
              data-test={ATTRIBUTION_SHOW_MORE_TEST_ID}
            >
              {translate('text_1792668632007fulz8omi190')}
            </Button>
          )}
        </div>
      ),
      columns: valueColumns,
    })

    const totalColumn = columnHelper.display({
      id: 'total',
      meta: { align: 'right' },
      header: () => renderHeaderLabel(translate('text_1738063764295zomiafl8b4s')),
      footer: () => renderTotalValue(totals),
      cell: ({ row }) => (row.original.kind === 'data' ? renderTotalValue(row.original) : null),
    })

    return columns.length ? [entityColumn, chargesColumn, totalColumn] : [entityColumn, totalColumn]
  }, [basis, chargeLabel, columns, currency, nodes, onLoadMore, showMoreColumns, totals, translate])

  const table = useComposableTable({
    data: rows,
    columns: tableColumns,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.kind === 'data' ? row.subRows : undefined),
    getRowCanExpand: (row) => row.original.kind === 'data' && !row.original.level.isLeaf,
    initialState: { columnPinning: { start: ['entity'], end: ['total'] } },
    state: { expanded },
    onExpandedChange: handleExpandedChange,
  })

  return (
    <ComposableTableView
      table={table}
      isLoading={isLoading}
      hasFooter
      footerDataTest={ATTRIBUTION_TABLE_FOOTER_TEST_ID}
      getRowDataTest={(row) =>
        row.original.kind === 'data' ? ATTRIBUTION_TREE_ROW_TEST_ID : undefined
      }
      data-test={ATTRIBUTION_TREE_TABLE_TEST_ID}
    />
  )
}
