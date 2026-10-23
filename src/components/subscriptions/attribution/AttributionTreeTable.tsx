import { Fragment, ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  AttributionEntityCell,
  AttributionLoadMoreRow,
  AttributionTableLayout,
  AttributionTableRow,
  AttributionTableSharedProps,
  AttributionValueCells,
} from './AttributionFlatTable'
import { AttributionLevel, AttributionPathStep, getAttributionNodeKey } from './attributionTree'
import { AttributionTreeBlock, AttributionTreeNodes } from './useAttributionTree'

export const ATTRIBUTION_TREE_TABLE_TEST_ID = 'attribution-tree-table'
export const ATTRIBUTION_TREE_ROW_TEST_ID = 'attribution-tree-table-row'
export const ATTRIBUTION_TREE_TOGGLE_TEST_ID = 'attribution-tree-toggle'
export const ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID = 'attribution-tree-load-more-rows'

const INDENT_CLASS_BY_DEPTH = ['pl-0', 'pl-4', 'pl-8', 'pl-12', 'pl-16', 'pl-20', 'pl-24']
const ROOT_NODE_KEY = getAttributionNodeKey([])

type AttributionTreeTableProps = AttributionTableSharedProps & {
  nodes: AttributionTreeNodes
  onToggleNode: (path: AttributionPathStep[], levelCode: string) => void
  onLoadMore: (path: AttributionPathStep[], blockIndex: number) => void
}

type AttributionTreeRow = Pick<
  AttributionTableRow,
  'typeLabel' | 'label' | 'isUnattributed' | 'amountCents' | 'chargesUsage'
> & {
  path: AttributionPathStep[]
  nodeKey: string
  level: AttributionLevel
  depth: number
}

export const AttributionTreeTable = ({
  nodes,
  onToggleNode,
  onLoadMore,
  ...tableProps
}: AttributionTreeTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { columns, basis, currency } = tableProps

  const renderToggle = (row: AttributionTreeRow): ReactNode => {
    if (row.level.isLeaf) return <span className="size-6 shrink-0" />

    const node = nodes[row.nodeKey]
    const isOpen = node?.status === 'loaded' && node.isExpanded

    return (
      <Button
        variant="quaternary"
        size="small"
        icon={isOpen ? 'chevron-down-filled' : 'chevron-right-filled'}
        aria-label={row.label}
        aria-expanded={isOpen}
        loading={node?.status === 'loading'}
        disabled={node?.status === 'loading'}
        onClick={() => onToggleNode(row.path, row.level.code)}
        data-test={ATTRIBUTION_TREE_TOGGLE_TEST_ID}
      />
    )
  }

  const renderRow = (row: AttributionTreeRow): ReactNode => (
    <Fragment key={row.nodeKey}>
      <tr data-test={ATTRIBUTION_TREE_ROW_TEST_ID}>
        <AttributionEntityCell
          typeLabel={row.typeLabel}
          label={row.label}
          isUnattributed={row.isUnattributed}
          indentClassName={INDENT_CLASS_BY_DEPTH[row.depth]}
          toggle={renderToggle(row)}
        />
        <AttributionValueCells usage={row} columns={columns} basis={basis} currency={currency} />
      </tr>
      {renderChildren(row.path, row.depth + 1, row.nodeKey)}
    </Fragment>
  )

  const renderLoadMoreRow = (
    block: AttributionTreeBlock,
    path: AttributionPathStep[],
    blockIndex: number,
    depth: number,
    nodeKey: string,
  ): ReactNode => {
    const { currentPage, totalPages } = block.usage.metadata

    if (currentPage >= totalPages) return null

    return (
      <AttributionLoadMoreRow
        key={`${nodeKey}-load-more-${block.level.code}`}
        columns={columns}
        isLoading={block.isLoadingMore}
        onLoadMore={() => onLoadMore(path, blockIndex)}
        indentClassName={INDENT_CLASS_BY_DEPTH[depth]}
        data-test={ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID}
      />
    )
  }

  const renderBlock = (
    block: AttributionTreeBlock,
    path: AttributionPathStep[],
    blockIndex: number,
    depth: number,
    nodeKey: string,
  ): ReactNode => {
    const { level, usage } = block

    const toRow = (value: string | null): Pick<AttributionTreeRow, 'path' | 'nodeKey'> => {
      const rowPath = [...path, { code: level.code, value }]

      return { path: rowPath, nodeKey: getAttributionNodeKey(rowPath) }
    }

    return (
      <Fragment key={`${nodeKey}-${level.code}`}>
        {usage.rows.map((row) =>
          renderRow({
            ...toRow(row.value),
            level,
            depth,
            typeLabel: level.name,
            label: row.value,
            isUnattributed: false,
            amountCents: row.amountCents,
            chargesUsage: row.chargesUsage,
          }),
        )}
        {renderLoadMoreRow(block, path, blockIndex, depth, nodeKey)}
        {renderRow({
          ...toRow(null),
          level,
          depth,
          typeLabel: translate('text_1792668632007lqi5wcqidcx'),
          label: translate('text_1792668632007qgsxnaul7fn', { typeName: level.name }),
          isUnattributed: true,
          amountCents: usage.unattributed.amountCents,
          chargesUsage: usage.unattributed.chargesUsage,
        })}
      </Fragment>
    )
  }

  const renderChildren = (
    path: AttributionPathStep[],
    depth: number,
    nodeKey: string,
  ): ReactNode => {
    const node = nodes[nodeKey]

    if (node?.status !== 'loaded' || !node.isExpanded) return null

    return node.blocks.map((block, blockIndex) =>
      renderBlock(block, path, blockIndex, depth, nodeKey),
    )
  }

  return (
    <AttributionTableLayout {...tableProps} data-test={ATTRIBUTION_TREE_TABLE_TEST_ID}>
      {renderChildren([], 0, ROOT_NODE_KEY)}
    </AttributionTableLayout>
  )
}
