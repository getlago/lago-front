import { ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'

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
