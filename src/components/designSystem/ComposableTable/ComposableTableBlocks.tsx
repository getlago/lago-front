import { ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'

const INDENT_STEP_PX = 16

export const ComposableTableToggleSpacer = (): JSX.Element => <span className="size-4 shrink-0" />

type ComposableTableExpandToggleProps = {
  label: string
  isExpanded: boolean
  isLoading?: boolean
  onToggle: () => void
  'data-test'?: string
}

export const ComposableTableExpandToggle = ({
  label,
  isExpanded,
  isLoading = false,
  onToggle,
  'data-test': dataTest,
}: ComposableTableExpandToggleProps): JSX.Element => (
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

type ComposableTableTreeCellProps = {
  depth: number
  toggle?: ReactNode
  children: ReactNode
}

export const ComposableTableTreeCell = ({
  depth,
  toggle = <ComposableTableToggleSpacer />,
  children,
}: ComposableTableTreeCellProps): JSX.Element => (
  <div className="flex items-center gap-2" style={{ paddingLeft: depth * INDENT_STEP_PX }}>
    {toggle}
    {children}
  </div>
)

type ComposableTableLoadMoreProps = {
  label: string
  isLoading: boolean
  onLoadMore: () => void
  'data-test'?: string
}

export const ComposableTableLoadMore = ({
  label,
  isLoading,
  onLoadMore,
  'data-test': dataTest,
}: ComposableTableLoadMoreProps): JSX.Element => (
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

type ComposableTableInlineErrorProps = {
  label: string
  retryLabel: string
  onRetry: () => void
  'data-test'?: string
}

export const ComposableTableInlineError = ({
  label,
  retryLabel,
  onRetry,
  'data-test': dataTest,
}: ComposableTableInlineErrorProps): JSX.Element => (
  <div className="flex items-center gap-2" data-test={dataTest}>
    <Typography variant="caption" color="danger600" noWrap>
      {label}
    </Typography>
    <Button variant="inline" size="small" onClick={onRetry}>
      {retryLabel}
    </Button>
  </div>
)

type ComposableTableGroupHeaderProps = {
  label: ReactNode
  action?: ReactNode
}

export const ComposableTableGroupHeader = ({
  label,
  action,
}: ComposableTableGroupHeaderProps): JSX.Element => (
  <div className="flex items-center justify-between gap-4">
    <Typography variant="captionHl" color="grey600" noWrap>
      {label}
    </Typography>
    {action}
  </div>
)

export const ComposableTableSkeletonCell = ({
  'data-test': dataTest,
}: {
  'data-test'?: string
}): JSX.Element => (
  <span data-test={dataTest}>
    <Skeleton variant="text" className="ml-auto w-16" />
  </span>
)
