import { gql, useLazyQuery } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { Chip } from '~/components/designSystem/Chip'
import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Table, TableColumn } from '~/components/designSystem/Table'
import { Typography } from '~/components/designSystem/Typography'
import { SearchInput } from '~/components/SearchInput'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

import { ADMIN_PORTAL_ORGANIZATION_DETAIL_ROUTE } from './routes'

const ADMIN_ORGANIZATIONS_QUERY = gql`
  query adminOrganizations($page: Int, $limit: Int, $searchTerm: String) {
    adminOrganizations(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        name
        createdAt
        premiumIntegrationsCount
        premiumIntegrations
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

interface AdminOrganization {
  id: string
  name: string
  createdAt: string
  premiumIntegrationsCount: number
  premiumIntegrations: string[]
}

interface AdminOrganizationsResult {
  adminOrganizations: {
    collection: AdminOrganization[]
    metadata: {
      currentPage: number
      totalPages: number
      totalCount: number
    }
  }
}

const AdminOrganizations = () => {
  const [getOrganizations, { data, loading, error, fetchMore }] =
    useLazyQuery<AdminOrganizationsResult>(ADMIN_ORGANIZATIONS_QUERY, {
      variables: { page: 1, limit: 25 },
      notifyOnNetworkStatusChange: true,
    })

  const { debouncedSearch, isLoading } = useDebouncedSearch(getOrganizations, loading)

  const organizations = data?.adminOrganizations?.collection || []
  const metadata = data?.adminOrganizations?.metadata

  const columns: TableColumn<AdminOrganization>[] = [
    {
      key: 'name',
      title: 'Name',
      maxSpace: true,
      content: ({ name }) => <Typography variant="bodyHl">{name}</Typography>,
    },
    {
      key: 'premiumIntegrationsCount',
      title: 'Premium Integrations',
      content: ({ premiumIntegrationsCount, premiumIntegrations }) => (
        <div className="flex items-center gap-2">
          <Typography>{premiumIntegrationsCount}</Typography>
          {premiumIntegrationsCount > 0 && (
            <Chip
              label={premiumIntegrations.slice(0, 2).join(', ').replace(/_/g, ' ')}
              size="small"
            />
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      minWidth: 130,
      content: ({ createdAt }) => (
        <Typography>
          {new Date(createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Typography>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Typography variant="headline">Organizations</Typography>
          {metadata && <Chip label={`${metadata.totalCount}`} size="small" />}
        </div>

        <SearchInput onChange={debouncedSearch} placeholder="Search by name, email or ID..." />
      </div>

      <InfiniteScroll
        onBottom={async () => {
          const { currentPage = 0, totalPages = 0 } = metadata || {}

          if (currentPage < totalPages && !isLoading) {
            await fetchMore?.({
              variables: { page: currentPage + 1 },
            })
          }
        }}
      >
        <Table
          name="admin-organizations"
          containerSize={{ default: 0 }}
          rowSize={72}
          columns={columns}
          data={organizations}
          isLoading={isLoading}
          hasError={!!error}
          onRowActionLink={(org) =>
            generatePath(ADMIN_PORTAL_ORGANIZATION_DETAIL_ROUTE, { organizationId: org.id })
          }
          placeholder={{
            emptyState: {
              title: 'No organizations found',
              subtitle: 'Try a different search term.',
            },
            errorState: {
              title: 'Failed to load organizations',
              subtitle: 'Something went wrong. Please try again.',
            },
          }}
        />
      </InfiniteScroll>
    </div>
  )
}

export default AdminOrganizations
