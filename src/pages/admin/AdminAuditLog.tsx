import { gql, useMutation, useQuery } from '@apollo/client'
import { debounce } from 'lodash'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AuditLogEntry, AuditLogTable } from '~/components/admin/AuditLogTable'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import {
  AdminAuditLogAvailableFilters,
  Filters,
  formatFiltersForAdminAuditLogQuery,
} from '~/components/Filters'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import { ADMIN_AUDIT_LOG_FILTER_PREFIX } from '~/core/constants/filters'

const ADMIN_AUDIT_LOGS_QUERY = gql`
  query AdminAuditLogs(
    $organizationIds: [ID!]
    $featureKey: String
    $featureType: AdminFeatureTypeEnum
    $actions: [AdminActionEnum!]
    $fromDate: ISO8601Date
    $toDate: ISO8601Date
    $page: Int
    $limit: Int
  ) {
    adminAuditLogs(
      organizationIds: $organizationIds
      featureKey: $featureKey
      featureType: $featureType
      actions: $actions
      fromDate: $fromDate
      toDate: $toDate
      page: $page
      limit: $limit
    ) {
      collection {
        id
        actorEmail
        action
        organizationId
        organizationName
        featureType
        featureKey
        beforeValue
        afterValue
        reason
        batchId
        rollbackOfId
        rolledBack
        createdAt
      }
      metadata {
        currentPage
        totalCount
        totalPages
      }
    }
  }
`

const ADMIN_ROLLBACK_CHANGE_MUTATION = gql`
  mutation AdminRollbackChange($input: AdminRollbackChangeInput!) {
    adminRollbackChange(input: $input) {
      id
      action
      rollbackOfId
    }
  }
`

const PAGE_SIZE = 20

const AdminAuditLog = () => {
  const { page, goToPage } = usePageSearchParam()
  const [searchParams] = useSearchParams()

  const [featureKey, setFeatureKey] = useState('')

  const filtersForQuery = useMemo(
    () => formatFiltersForAdminAuditLogQuery(searchParams),
    [searchParams],
  )

  const { data, error, loading, refetch } = useQuery(ADMIN_AUDIT_LOGS_QUERY, {
    notifyOnNetworkStatusChange: true,
    variables: {
      limit: PAGE_SIZE,
      page,
      featureKey: featureKey || undefined,
      ...filtersForQuery,
    },
  })

  const [rollbackChange] = useMutation(ADMIN_ROLLBACK_CHANGE_MUTATION)

  const isLoading = loading

  const debouncedSetFeatureKey = useMemo(
    () => debounce((value: string) => setFeatureKey(value || ''), 500),
    [],
  )

  const handleSearch = (value: string) => {
    goToPage(1)
    debouncedSetFeatureKey(value)
  }

  const auditLogs: AuditLogEntry[] = data?.adminAuditLogs?.collection || []
  const metadata = data?.adminAuditLogs?.metadata

  const handleRollback = async (entry: AuditLogEntry, reason: string) => {
    await rollbackChange({
      variables: {
        input: {
          auditLogId: entry.id,
          reason,
        },
      },
    })
    await refetch()
  }

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: 'Audit Log',
          metadata:
            metadata?.totalCount !== null && metadata?.totalCount !== undefined
              ? `${metadata.totalCount} entries`
              : undefined,
          metadataLoading: isLoading,
        }}
        filtersSection={
          <SearchInput onChange={handleSearch} placeholder="Search by feature key..." />
        }
      />

      <div className="px-4 pb-4 pt-6 md:px-12">
        <Filters.Provider
          displayInDialog
          filtersNamePrefix={ADMIN_AUDIT_LOG_FILTER_PREFIX}
          availableFilters={AdminAuditLogAvailableFilters}
        >
          <Filters.Component />
        </Filters.Provider>
      </div>

      <PaginatedContent
        insetPager
        metadata={metadata}
        loading={isLoading}
        pageSize={PAGE_SIZE}
        onPageChange={goToPage}
      >
        <AuditLogTable
          data={auditLogs}
          isLoading={isLoading}
          hasError={!!error}
          featureKey={featureKey || undefined}
          onRollback={handleRollback}
        />
      </PaginatedContent>
    </>
  )
}

export default AdminAuditLog
