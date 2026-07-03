import { IconName } from 'lago-design-system'

import { PaginatedContent } from '~/components/designSystem/PaginatedContent'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface QuotesSectionTableProps<T> {
  name: string
  data: T[]
  isLoading: boolean
  hasError: boolean
  metadata: { currentPage: number; totalPages: number; totalCount: number } | undefined
  fetchMore: ((opts: { variables: { page: number } }) => Promise<unknown>) | undefined
  columns: Array<TableColumn<T>>
  emptyState: { title: string; subtitle: string }
  getActions?: (row: T) => Array<{ icon: IconName; label: string; onAction: () => void }>
  onRowActionLink?: (row: T) => string
  className?: string
  containerClassName?: string
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
}

export const QuotesSectionTable = <T extends { id: string }>({
  name,
  data,
  isLoading,
  hasError,
  metadata,
  fetchMore,
  columns,
  emptyState,
  getActions,
  onRowActionLink,
  className,
  containerClassName,
  pageSize,
  onPageSizeChange,
}: QuotesSectionTableProps<T>): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <DetailsPage.Container className={className}>
      <PaginatedContent
        metadata={metadata}
        loading={isLoading}
        pageSize={pageSize}
        onPageChange={(page) => fetchMore?.({ variables: { page } })}
        onPageSizeChange={onPageSizeChange}
      >
        <Table
          name={name}
          containerClassName={containerClassName}
          data={isLoading ? [] : data}
          loadingRowCount={pageSize}
          isLoading={isLoading}
          hasError={hasError}
          containerSize={0}
          columns={columns}
          onRowActionLink={onRowActionLink}
          actionColumnTooltip={
            getActions ? () => translate('text_1776414006125pcxcyeblul7') : undefined
          }
          actionColumn={
            getActions
              ? (row) => {
                  const actions = getActions(row)

                  if (actions.length === 0) return null

                  return actions.map(({ icon, label, onAction }) => ({
                    startIcon: icon,
                    title: label,
                    onAction: () => onAction(),
                  }))
                }
              : undefined
          }
          placeholder={{
            emptyState: {
              title: emptyState.title,
              subtitle: emptyState.subtitle,
            },
          }}
        />
      </PaginatedContent>
    </DetailsPage.Container>
  )
}
