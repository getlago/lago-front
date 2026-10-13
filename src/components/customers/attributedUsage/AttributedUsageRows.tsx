import { Icon } from 'lago-design-system'
import { ReactNode } from 'react'

import { tw } from '~/styles/utils'

import { useAttributedUsageView } from './AttributedUsageContext'
import {
  AggregateData,
  columnWidth,
  displayCell,
  displayTotal,
  indexCells,
  TOTAL_COLUMN_WIDTH,
} from './utils'

export const indentOf = (depth: number): number => 16 + depth * 24

type UsageCellsProps = {
  aggregate?: AggregateData
  muted?: boolean
  emphasized?: boolean
}

export const UsageCells = ({ aggregate, muted, emphasized }: UsageCellsProps): JSX.Element => {
  const { columnGroups, basis, currency } = useAttributedUsageView()
  const cells = indexCells(aggregate?.chargesUsage)

  return (
    <>
      {columnGroups.map((group) => (
        <div key={group.charge.id} className="flex shrink-0 border-l border-grey-200">
          {group.columns.map((column) => {
            const display = displayCell({ cell: cells.get(column.key), group, basis, currency })

            return (
              <div
                key={column.key}
                title={display.title}
                style={{ width: columnWidth(group) }}
                className={tw(
                  'font-mono shrink-0 whitespace-nowrap px-2.5 text-right text-xs',
                  emphasized ? 'py-3 font-semibold' : 'py-2.5',
                  display.muted && 'text-grey-400',
                  !display.muted && (muted ? 'text-grey-500' : 'text-grey-700'),
                )}
              >
                {display.value}
              </div>
            )
          })}
        </div>
      ))}
      <div
        style={{ width: TOTAL_COLUMN_WIDTH }}
        className={tw(
          'shrink-0 whitespace-nowrap border-l border-grey-200 px-4 text-right text-sm font-semibold tracking-tight',
          emphasized ? 'py-3' : 'py-2.5',
          muted ? 'text-grey-500' : 'text-grey-700',
        )}
      >
        {displayTotal({ aggregate, basis, currency })}
      </div>
    </>
  )
}

type LabelVariant = 'strong' | 'default' | 'code' | 'muted'

const LABEL_CLASSES: Record<LabelVariant, string> = {
  strong: 'text-sm font-semibold text-grey-700',
  default: 'text-sm font-medium text-grey-700',
  code: 'font-mono text-xs text-grey-600',
  muted: 'text-sm font-medium text-grey-500',
}

type UsageRowProps = {
  label: string
  typeLabel?: string
  depth: number
  aggregate?: AggregateData
  labelVariant?: LabelVariant
  muted?: boolean
  highlighted?: boolean
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
}

export const UsageRow = ({
  label,
  typeLabel,
  depth,
  aggregate,
  labelVariant = 'default',
  muted,
  highlighted,
  expandable,
  expanded,
  onToggle,
}: UsageRowProps): JSX.Element => (
  <div
    role={expandable ? 'button' : undefined}
    tabIndex={expandable ? 0 : undefined}
    onClick={expandable ? onToggle : undefined}
    onKeyDown={(event) => {
      if (expandable && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        onToggle?.()
      }
    }}
    className={tw(
      'flex items-stretch border-b border-grey-200 hover:bg-grey-100',
      expandable && 'cursor-pointer',
      highlighted && 'bg-blue-100',
    )}
  >
    <div
      className="flex min-w-56 flex-1 items-center gap-2 overflow-hidden py-2.5 pr-4"
      style={{ paddingLeft: indentOf(depth) }}
    >
      {expandable ? (
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size="small" color="dark" />
      ) : (
        <span className="w-3 shrink-0" />
      )}
      <span className={tw('truncate', LABEL_CLASSES[labelVariant])}>{label}</span>
      {typeLabel && <span className="whitespace-nowrap text-xs text-grey-500">{typeLabel}</span>}
    </div>
    <UsageCells aggregate={aggregate} muted={muted} />
  </div>
)

export const SkeletonRows = ({
  depth,
  count = 3,
}: {
  depth: number
  count?: number
}): JSX.Element => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="flex h-10 items-center gap-3 border-b border-grey-200 pr-4"
        style={{ paddingLeft: indentOf(depth) }}
      >
        <span className="w-3 shrink-0" />
        <span
          className="h-2.5 animate-pulse rounded bg-grey-200"
          style={{ width: [150, 118, 170][index % 3] }}
        />
        <span className="flex-1" />
        <span className="h-2.5 w-96 max-w-[40%] animate-pulse rounded bg-grey-100" />
      </div>
    ))}
  </>
)

export const MoreRow = ({
  depth,
  label,
  meta,
  onClick,
}: {
  depth: number
  label: string
  meta?: string
  onClick: () => void
}): JSX.Element => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-2 border-b border-grey-200 py-2 pr-4 text-left hover:bg-grey-100"
    style={{ paddingLeft: indentOf(depth) + 22 }}
  >
    <Icon name="plus" size="small" color="dark" />
    <span className="text-xs font-medium text-blue-600">{label}</span>
    {meta && <span className="text-xs text-grey-500">{meta}</span>}
  </button>
)

export const MessageRow = ({
  depth,
  children,
}: {
  depth: number
  children: ReactNode
}): JSX.Element => (
  <div
    className="flex items-center gap-2 border-b border-grey-200 py-2.5 pr-4 text-xs text-grey-600"
    style={{ paddingLeft: indentOf(depth) + 22 }}
  >
    <Icon name="warning-unfilled" size="small" color="warning" />
    {children}
  </div>
)
