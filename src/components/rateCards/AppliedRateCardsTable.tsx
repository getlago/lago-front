import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { ReactNode } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import { PaginatedContent } from '~/components/designSystem/Pagination/PaginatedContent'
import { Table, TableColumn, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { CollectionMetadata } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { getGroupKey, groupRowsByCategory } from './groupRowsByCategory'
import { AppliedRateCardRow, RateCardRemoval } from './types'

gql`
  fragment PlanAppliedRateCardForAppliedRateCardsTable on PlanAppliedRateCard {
    id
    ratePhasesCount
    product {
      id
      name
      invoiceDisplayName
      productCategory {
        id
        name
        invoiceDisplayName
      }
    }
    rateCard {
      id
      name
      code
      productFilter {
        id
        name
        invoiceDisplayName
      }
    }
  }

  fragment ContractAppliedRateCardForAppliedRateCardsTable on ContractAppliedRateCard {
    id
    ratePhasesCount
    product {
      id
      name
      invoiceDisplayName
      productCategory {
        id
        name
        invoiceDisplayName
      }
    }
    rateCard {
      id
      name
      code
      productFilter {
        id
        name
        invoiceDisplayName
      }
    }
  }
`

type AppliedRateCardsTableProps<T extends AppliedRateCardRow> = {
  rows: T[]
  metadata?: Pick<CollectionMetadata, 'currentPage' | 'totalPages' | 'totalCount'>
  loading: boolean
  hasError?: boolean
  placeholder?: TablePlaceholder
  onPageChange: (page: number) => void
  getRateCardHref: (row: T) => string
  onCopyRateCardCode: (row: T) => void
  onRemoveRateCard: (row: T) => void
  removal: RateCardRemoval
}

const getProductLabel = (row: AppliedRateCardRow): string => {
  if (row.rateCard.productFilter) {
    return row.rateCard.productFilter.invoiceDisplayName || row.rateCard.productFilter.name
  }

  return row.product.invoiceDisplayName || row.product.name
}

export const AppliedRateCardsTable = <T extends AppliedRateCardRow>({
  rows,
  metadata,
  loading,
  hasError = false,
  placeholder,
  onPageChange,
  getRateCardHref,
  onCopyRateCardCode,
  onRemoveRateCard,
  removal,
}: AppliedRateCardsTableProps<T>): JSX.Element => {
  const { translate } = useInternationalization()
  const groupedRows = groupRowsByCategory(rows)

  const renderGroupHeader = (row: T): ReactNode => {
    const category = row.product.productCategory

    if (!category) {
      return (
        <div className="flex items-center gap-2">
          <Icon name="folder-close" size="small" />
          <Typography variant="bodyHl" color="grey700">
            {translate('text_1790284386156njn3ittr9qj')}
          </Typography>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <Icon name="box" size="small" />
        <Typography variant="bodyHl" color="grey700">
          {category.invoiceDisplayName || category.name}
        </Typography>
      </div>
    )
  }

  const getRowGroupHeader = (row: T, index: number, data: T[]): ReactNode | undefined => {
    const groupKey = getGroupKey(row)
    const previousGroupKey = index > 0 ? getGroupKey(data[index - 1]) : undefined

    if (groupKey === previousGroupKey) return undefined

    return renderGroupHeader(row)
  }

  const getRemoveActionItem = (row: T): ActionItem<T> | null => {
    if (removal.status === 'hidden') return null

    return {
      title: translate('text_1790284386156k2d8mjjy98f'),
      startIcon: 'trash',
      disabled: removal.status === 'disabled',
      onAction: () => onRemoveRateCard(row),
    }
  }

  const columns: Array<TableColumn<T>> = [
    {
      key: 'product' as TableColumn<T>['key'],
      title: translate('text_1790284386156lsvbnuzz5s7'),
      minWidth: 240,
      maxSpace: true,
      content: (row) => (
        <Typography variant="body" color="grey700" noWrap>
          {getProductLabel(row)}
        </Typography>
      ),
    },
    {
      key: 'rateCard.name' as TableColumn<T>['key'],
      title: translate('text_17902843861564ti9tbk3ide'),
      minWidth: 160,
      content: (row) => <Chip label={row.rateCard.name} size="small" />,
    },
    {
      key: 'ratePhasesCount' as TableColumn<T>['key'],
      title: translate('text_17902843861566isyrs5l0jm'),
      textAlign: 'right',
      minWidth: 100,
      content: (row) => (
        <Typography variant="body" color="grey600" noWrap>
          {row.ratePhasesCount}
        </Typography>
      ),
    },
  ]

  return (
    <PaginatedContent
      metadata={metadata}
      loading={loading}
      onPageChange={onPageChange}
      sticky={false}
    >
      <Table
        name="applied-rate-cards"
        data={groupedRows}
        columns={columns}
        isLoading={loading}
        hasError={hasError}
        placeholder={placeholder}
        containerSize={0}
        rowSize={72}
        getRowGroupHeader={getRowGroupHeader}
        onRowActionLink={getRateCardHref}
        actionColumn={(row) => [
          {
            title: translate('text_1790284386156m6phatx4cxa'),
            startIcon: 'duplicate',
            onAction: () => onCopyRateCardCode(row),
          },
          getRemoveActionItem(row),
        ]}
      />
    </PaginatedContent>
  )
}
