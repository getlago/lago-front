import { gql, useLazyQuery } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { Chip } from '~/components/designSystem/Chip'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import {
  ADMIN_ORGANIZATION_CREATE_ROUTE,
  ADMIN_ORGANIZATION_DETAIL_ROUTE,
  useNavigate,
} from '~/core/router'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

interface AdminOrganizationItem {
  id: string
  name: string
  email: string | null
  createdAt: string
  premiumIntegrations: string[]
  featureFlags: string[]
}

interface AdminOrganizationsQueryResult {
  adminOrganizations: {
    collection: AdminOrganizationItem[]
    metadata: {
      currentPage: number
      totalCount: number
      totalPages: number
    }
  }
}

const ADMIN_ORGANIZATIONS_QUERY = gql`
  query AdminOrganizations($searchTerm: String, $page: Int, $limit: Int) {
    adminOrganizations(searchTerm: $searchTerm, page: $page, limit: $limit) {
      collection {
        id
        name
        email
        createdAt
        premiumIntegrations
        featureFlags
      }
      metadata {
        currentPage
        totalCount
        totalPages
      }
    }
  }
`

const PAGE_SIZE = 20

const AdminOrganizations = () => {
  const navigate = useNavigate()
  const { page, goToPage } = usePageSearchParam()
  const [getOrganizations, { data, error, loading, variables }] =
    useLazyQuery<AdminOrganizationsQueryResult>(ADMIN_ORGANIZATIONS_QUERY, {
      notifyOnNetworkStatusChange: true,
      variables: {
        limit: PAGE_SIZE,
        page,
      },
    })

  const { debouncedSearch, isLoading } = useDebouncedSearch(getOrganizations, loading)

  const searchAndResetPage = (value: string) => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  const organizations = data?.adminOrganizations?.collection || []
  const metadata = data?.adminOrganizations?.metadata

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: 'Organizations',
          metadata:
            metadata?.totalCount !== null ? `${metadata?.totalCount} organizations` : undefined,
          metadataLoading: isLoading,
        }}
        actions={{
          items: [
            {
              type: 'action',
              label: 'Create organization',
              variant: 'primary',
              onClick: () => navigate(ADMIN_ORGANIZATION_CREATE_ROUTE, { skipSlugPrepend: true }),
            },
          ],
        }}
        filtersSection={
          <SearchInput onChange={searchAndResetPage} placeholder="Search organizations..." />
        }
      />

      <PaginatedContent
        insetPager
        metadata={metadata}
        loading={isLoading}
        pageSize={PAGE_SIZE}
        onPageChange={goToPage}
      >
        <Table<AdminOrganizationItem>
          name="admin-organizations-list"
          isLoading={isLoading}
          hasError={!!error}
          data={organizations}
          containerSize={{
            default: 16,
            md: 48,
          }}
          containerClassName="border-t border-grey-300"
          onRowActionLink={(org) =>
            generatePath(ADMIN_ORGANIZATION_DETAIL_ROUTE, { organizationId: org.id })
          }
          placeholder={{
            errorState: variables?.searchTerm
              ? {
                  title: 'Search failed',
                  subtitle: 'An error occurred while searching. Please try again.',
                }
              : {
                  title: 'Something went wrong',
                  subtitle: 'Failed to load organizations.',
                  buttonTitle: 'Retry',
                  buttonAction: () => location.reload(),
                  buttonVariant: 'primary',
                },
            emptyState: {
              title: variables?.searchTerm ? 'No organizations found' : 'No organizations yet',
              subtitle: variables?.searchTerm
                ? `No results for "${variables.searchTerm}"`
                : 'Organizations will appear here.',
            },
          }}
          columns={[
            {
              key: 'name',
              title: 'Name',
              minWidth: 200,
              content: (org) => (
                <Typography variant="bodyHl" color="textSecondary" noWrap>
                  {org.name || '-'}
                </Typography>
              ),
            },
            {
              key: 'id',
              title: 'Premium Integrations',
              minWidth: 200,
              maxSpace: true,
              content: (org) => {
                const integrations: string[] = org.premiumIntegrations || []

                if (integrations.length === 0) return <Typography color="grey600">-</Typography>

                return (
                  <div className="flex flex-wrap gap-1">
                    {integrations.map((integration: string) => (
                      <Chip key={integration} label={integration} size="small" />
                    ))}
                  </div>
                )
              },
            },
            {
              key: 'email',
              title: 'Feature Flags',
              minWidth: 200,
              maxSpace: true,
              content: (org) => {
                const flags: string[] = org.featureFlags || []

                if (flags.length === 0) return <Typography color="grey600">-</Typography>

                return (
                  <div className="flex flex-wrap gap-1">
                    {flags.map((flag: string) => (
                      <Chip key={flag} label={flag} size="small" />
                    ))}
                  </div>
                )
              },
            },
            {
              key: 'createdAt',
              title: 'Created',
              minWidth: 160,
              content: (org) => (
                <Typography color="grey600" variant="body">
                  {intlFormatDateTime(org.createdAt, { formatDate: DateFormat.DATE_MED }).date}
                </Typography>
              ),
            },
          ]}
        />
      </PaginatedContent>
    </>
  )
}

export default AdminOrganizations
