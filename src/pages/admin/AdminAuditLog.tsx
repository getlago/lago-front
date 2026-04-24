import { gql, useLazyQuery, useMutation } from '@apollo/client'
import { debounce } from 'lodash'
import { useCallback, useEffect, useState } from 'react'

import { AuditLogEntry, AuditLogTable } from '~/components/admin/AuditLogTable'
import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'

const ADMIN_AUDIT_LOGS_QUERY = gql`
  query AdminAuditLogs($organizationId: ID, $featureKey: String, $page: Int, $limit: Int) {
    adminAuditLogs(
      organizationId: $organizationId
      featureKey: $featureKey
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

const AdminAuditLog = () => {
  const [getAuditLogs, { data, error, loading, fetchMore, refetch, variables }] = useLazyQuery(
    ADMIN_AUDIT_LOGS_QUERY,
    {
      notifyOnNetworkStatusChange: true,
      variables: {
        limit: 20,
      },
    },
  )

  const [rollbackChange] = useMutation(ADMIN_ROLLBACK_CHANGE_MUTATION)
  const [featureKey, setFeatureKey] = useState<string>('')

  const isLoading = loading

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFeatureKey(value)
      getAuditLogs({
        variables: { featureKey: value || undefined },
      })
    }, 500),
    [],
  )

  // Trigger initial load
  useEffect(() => {
    getAuditLogs()
  }, [getAuditLogs])

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
    await refetch?.()
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
          <SearchInput onChange={debouncedSearch} placeholder="Search by feature key..." />
        }
      />

      <InfiniteScroll
        onBottom={() => {
          const { currentPage = 0, totalPages = 0 } = metadata || {}

          currentPage < totalPages &&
            !isLoading &&
            fetchMore?.({
              variables: { page: currentPage + 1 },
            })
        }}
      >
        <AuditLogTable
          data={auditLogs}
          isLoading={isLoading}
          hasError={!!error}
          featureKey={featureKey || undefined}
          onRollback={handleRollback}
        />
      </InfiniteScroll>
    </>
  )
}

export default AdminAuditLog
