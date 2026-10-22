import { Fragment, ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import {
  ATTRIBUTION_ENTITY_CELL_CLASSNAME,
  AttributionEmptyCells,
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

    const node = nodes[getAttributionNodeKey(row.path)]
    const isOpen = node?.status === 'loaded' && node.isExpanded

    return (
      <Button
        variant="quaternary"
        size="small"
        icon={isOpen ? 'chevron-down-filled' : 'chevron-right-filled'}
        loading={node?.status === 'loading'}
        disabled={node?.status === 'loading'}
        onClick={() => onToggleNode(row.path, row.level.code)}
        data-test={ATTRIBUTION_TREE_TOGGLE_TEST_ID}
      />
    )
  }

  const renderRow = (row: AttributionTreeRow): ReactNode => (
    <Fragment key={getAttributionNodeKey(row.path)}>
      <tr data-test={ATTRIBUTION_TREE_ROW_TEST_ID}>
        <td className={ATTRIBUTION_ENTITY_CELL_CLASSNAME}>
          <div className={tw('flex items-center gap-2', INDENT_CLASS_BY_DEPTH[row.depth])}>
            {renderToggle(row)}
            <Chip label={row.typeLabel} variant="captionCode" size="small" />
            <Typography variant="body" color={row.isUnattributed ? 'grey600' : 'grey700'} noWrap>
              {row.label}
            </Typography>
          </div>
        </td>
        <AttributionValueCells usage={row} columns={columns} basis={basis} currency={currency} />
      </tr>
      {renderChildren(row.path, row.depth + 1)}
    </Fragment>
  )

  const renderLoadMoreRow = (
    block: AttributionTreeBlock,
    path: AttributionPathStep[],
    blockIndex: number,
    depth: number,
  ): ReactNode => {
    const { currentPage, totalPages } = block.usage.metadata

    if (currentPage >= totalPages) return null

    return (
      <tr key={`${getAttributionNodeKey(path)}-load-more-${block.level.code}`}>
        <td className={ATTRIBUTION_ENTITY_CELL_CLASSNAME}>
          <div className={tw('flex items-center', INDENT_CLASS_BY_DEPTH[depth])}>
            <Button
              variant="inline"
              size="small"
              loading={block.isLoadingMore}
              disabled={block.isLoadingMore}
              onClick={() => onLoadMore(path, blockIndex)}
              data-test={ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID}
            >
              {translate('text_1792668632007fulz8omi190')}
            </Button>
          </div>
        </td>
        <AttributionEmptyCells columns={columns} />
      </tr>
    )
  }

  const renderBlock = (
    block: AttributionTreeBlock,
    path: AttributionPathStep[],
    blockIndex: number,
    depth: number,
  ): ReactNode => {
    const { level, usage } = block

    return (
      <Fragment key={`${getAttributionNodeKey(path)}-${level.code}`}>
        {usage.rows.map((row) =>
          renderRow({
            path: [...path, { code: level.code, value: row.value }],
            level,
            depth,
            typeLabel: level.name,
            label: row.value,
            isUnattributed: false,
            amountCents: row.amountCents,
            chargesUsage: row.chargesUsage,
          }),
        )}
        {renderLoadMoreRow(block, path, blockIndex, depth)}
        {renderRow({
          path: [...path, { code: level.code, value: null }],
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

  const renderChildren = (path: AttributionPathStep[], depth: number): ReactNode => {
    const node = nodes[getAttributionNodeKey(path)]

    if (node?.status !== 'loaded' || !node.isExpanded) return null

    return node.blocks.map((block, blockIndex) => renderBlock(block, path, blockIndex, depth))
  }

  return (
    <AttributionTableLayout {...tableProps} data-test={ATTRIBUTION_TREE_TABLE_TEST_ID}>
      {renderChildren([], 0)}
    </AttributionTableLayout>
  )
}
