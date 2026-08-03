import { gql, useMutation, useQuery } from '@apollo/client'
import { debounce } from 'lodash'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'

import { AuditLogEntry, AuditLogTable } from '~/components/admin/AuditLogTable'
import { Button } from '~/components/designSystem/Button'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { ComboBox } from '~/components/form/ComboBox/ComboBox'
import { DatePicker } from '~/components/form/DatePicker/DatePicker'
import { MultipleComboBox } from '~/components/form/MultipleComboBox/MultipleComboBox'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import { AdminActionEnum, AdminFeatureTypeEnum } from '~/generated/graphql'

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

const ADMIN_AUDIT_LOG_ORGANIZATIONS_QUERY = gql`
  query AdminAuditLogOrganizations($limit: Int) {
    adminOrganizations(limit: $limit) {
      collection {
        id
        name
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
const ORGANIZATIONS_LIMIT = 500

const FEATURE_TYPE_LABELS: Record<AdminFeatureTypeEnum, string> = {
  [AdminFeatureTypeEnum.PremiumIntegration]: 'Premium integration',
  [AdminFeatureTypeEnum.FeatureFlag]: 'Feature flag',
  [AdminFeatureTypeEnum.Organization]: 'Organization',
}

const ACTION_LABELS: Record<AdminActionEnum, string> = {
  [AdminActionEnum.ToggleOn]: 'Toggle on',
  [AdminActionEnum.ToggleOff]: 'Toggle off',
  [AdminActionEnum.OrgCreated]: 'Org created',
  [AdminActionEnum.Rollback]: 'Rollback',
}

const AdminAuditLog = () => {
  const { page, goToPage } = usePageSearchParam()

  const [featureKey, setFeatureKey] = useState('')
  const [featureType, setFeatureType] = useState<AdminFeatureTypeEnum | undefined>()
  const [actions, setActions] = useState<AdminActionEnum[]>([])
  const [organizationIds, setOrganizationIds] = useState<string[]>([])
  const [fromDate, setFromDate] = useState<string | undefined>()
  const [toDate, setToDate] = useState<string | undefined>()
  // Bumped to remount the (uncontrolled) search input when filters are cleared
  const [searchKey, setSearchKey] = useState(0)

  const { data, loading, error, refetch } = useQuery(ADMIN_AUDIT_LOGS_QUERY, {
    notifyOnNetworkStatusChange: true,
    variables: {
      limit: PAGE_SIZE,
      page,
      featureKey: featureKey || undefined,
      featureType,
      actions: actions.length ? actions : undefined,
      organizationIds: organizationIds.length ? organizationIds : undefined,
      fromDate: fromDate ? DateTime.fromISO(fromDate).toISODate() : undefined,
      toDate: toDate ? DateTime.fromISO(toDate).toISODate() : undefined,
    },
  })

  const { data: organizationsData, loading: organizationsLoading } = useQuery(
    ADMIN_AUDIT_LOG_ORGANIZATIONS_QUERY,
    { variables: { limit: ORGANIZATIONS_LIMIT } },
  )

  const [rollbackChange] = useMutation(ADMIN_ROLLBACK_CHANGE_MUTATION)

  const organizationOptions: { value: string; label: string }[] = useMemo(
    () =>
      (organizationsData?.adminOrganizations?.collection ?? []).map(
        (org: { id: string; name: string }) => ({ value: org.id, label: org.name }),
      ),
    [organizationsData],
  )

  const isLoading = loading

  // Any filter change returns to the first page (the current page may not exist for the new set)
  const debouncedSetFeatureKey = useMemo(
    () => debounce((value: string) => setFeatureKey(value || ''), 500),
    [],
  )

  const handleSearch = (value: string) => {
    goToPage(1)
    debouncedSetFeatureKey(value)
  }

  const handleFeatureTypeChange = (value?: string) => {
    goToPage(1)
    setFeatureType((value as AdminFeatureTypeEnum) || undefined)
  }

  const handleActionsChange = (values: string[]) => {
    goToPage(1)
    setActions(values as AdminActionEnum[])
  }

  const handleOrganizationsChange = (values: string[]) => {
    goToPage(1)
    setOrganizationIds(values)
  }

  const handleFromDateChange = (value?: string | null) => {
    goToPage(1)
    setFromDate(value || undefined)
  }

  const handleToDateChange = (value?: string | null) => {
    goToPage(1)
    setToDate(value || undefined)
  }

  const hasActiveFilters =
    !!featureKey ||
    !!featureType ||
    actions.length > 0 ||
    organizationIds.length > 0 ||
    !!fromDate ||
    !!toDate

  const clearFilters = () => {
    goToPage(1)
    setFeatureKey('')
    setFeatureType(undefined)
    setActions([])
    setOrganizationIds([])
    setFromDate(undefined)
    setToDate(undefined)
    setSearchKey((key) => key + 1)
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
          <SearchInput
            key={searchKey}
            onChange={handleSearch}
            placeholder="Search by feature key..."
          />
        }
      />

      <div className="flex flex-wrap items-end gap-4 px-4 pb-4 pt-6 md:px-12">
        <div className="w-52">
          <ComboBox
            placeholder="All types"
            value={featureType ?? ''}
            data={Object.values(AdminFeatureTypeEnum).map((type) => ({
              value: type,
              label: FEATURE_TYPE_LABELS[type],
            }))}
            onChange={handleFeatureTypeChange}
          />
        </div>

        <div className="w-56">
          <MultipleComboBox
            disableCloseOnSelect
            placeholder="All actions"
            data={Object.values(AdminActionEnum).map((action) => ({
              value: action,
              label: ACTION_LABELS[action],
            }))}
            value={actions.map((action) => ({ value: action, label: ACTION_LABELS[action] }))}
            onChange={(newValue) => handleActionsChange(newValue.map((item) => item.value))}
          />
        </div>

        <div className="w-64">
          <MultipleComboBox
            disableCloseOnSelect
            placeholder="All organizations"
            loading={organizationsLoading}
            data={organizationOptions}
            value={organizationIds.map((id) => ({
              value: id,
              label: organizationOptions.find((o) => o.value === id)?.label ?? id,
            }))}
            onChange={(newValue) => handleOrganizationsChange(newValue.map((item) => item.value))}
          />
        </div>

        <div className="w-40">
          <DatePicker
            name="fromDate"
            placeholder="From"
            value={fromDate}
            onChange={handleFromDateChange}
          />
        </div>

        <div className="w-40">
          <DatePicker name="toDate" placeholder="To" value={toDate} onChange={handleToDateChange} />
        </div>

        {hasActiveFilters && (
          <Button variant="quaternary" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
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
