import { ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'

const INDENT_STEP_PX = 16

export const DataTableToggleSpacer = (): JSX.Element => <span className="size-4 shrink-0" />

type DataTableExpandToggleProps = {
  label: string
  isExpanded: boolean
  isLoading?: boolean
  onToggle: () => void
  'data-test'?: string
}

export const DataTableExpandToggle = ({
  label,
  isExpanded,
  isLoading = false,
  onToggle,
  'data-test': dataTest,
}: DataTableExpandToggleProps): JSX.Element => (
  <Button
    className="-m-1"
    variant="quaternary"
    size="small"
    icon={isExpanded ? 'chevron-down-filled' : 'chevron-right-filled'}
    aria-label={label}
    aria-expanded={isExpanded}
    loading={isLoading}
    disabled={isLoading}
    onClick={onToggle}
    data-test={dataTest}
  />
)

type DataTableTreeCellProps = {
  depth: number
  toggle?: ReactNode
  children: ReactNode
}

export const DataTableTreeCell = ({
  depth,
  toggle = <DataTableToggleSpacer />,
  children,
}: DataTableTreeCellProps): JSX.Element => (
  <div className="flex items-center gap-2" style={{ paddingLeft: depth * INDENT_STEP_PX }}>
    {toggle}
    {children}
  </div>
)

type DataTableLoadMoreProps = {
  label: string
  isLoading: boolean
  onLoadMore: () => void
  'data-test'?: string
}

export const DataTableLoadMore = ({
  label,
  isLoading,
  onLoadMore,
  'data-test': dataTest,
}: DataTableLoadMoreProps): JSX.Element => (
  <Button
    variant="inline"
    size="small"
    loading={isLoading}
    disabled={isLoading}
    onClick={onLoadMore}
    data-test={dataTest}
  >
    {label}
  </Button>
)

type DataTableInlineErrorProps = {
  label: string
  retryLabel: string
  onRetry: () => void
  'data-test'?: string
}

export const DataTableInlineError = ({
  label,
  retryLabel,
  onRetry,
  'data-test': dataTest,
}: DataTableInlineErrorProps): JSX.Element => (
  <div className="flex items-center gap-2" data-test={dataTest}>
    <Typography variant="caption" color="danger600" noWrap>
      {label}
    </Typography>
    <Button variant="inline" size="small" onClick={onRetry}>
      {retryLabel}
    </Button>
  </div>
)

type DataTableGroupHeaderProps = {
  label: ReactNode
  action?: ReactNode
}

export const DataTableGroupHeader = ({ label, action }: DataTableGroupHeaderProps): JSX.Element => (
  <div className="flex items-center justify-between gap-4">
    <Typography variant="captionHl" color="grey600" noWrap>
      {label}
    </Typography>
    {action}
  </div>
)

export const DataTableSkeletonCell = ({
  'data-test': dataTest,
}: {
  'data-test'?: string
}): JSX.Element => (
  <span data-test={dataTest}>
    <Skeleton variant="text" className="ml-auto w-16" />
  </span>
)
