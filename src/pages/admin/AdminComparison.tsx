import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client'
import Switch from '@mui/material/Switch'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ComparisonMatrix, OrgData } from '~/components/admin/ComparisonMatrix'
import { Chip } from '~/components/designSystem/Chip'
import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

const ADMIN_ORGANIZATIONS_QUERY = gql`
  query AdminOrganizationsComparison($searchTerm: String, $page: Int, $limit: Int) {
    adminOrganizations(searchTerm: $searchTerm, page: $page, limit: $limit) {
      collection {
        id
        name
        premiumIntegrations
        featureFlags
        createdAt
      }
      metadata {
        currentPage
        totalCount
      }
    }
  }
`

const ADMIN_TOGGLE_FEATURE_MUTATION = gql`
  mutation AdminToggleFeatureComparison($input: AdminToggleFeatureInput!) {
    adminToggleFeature(input: $input) {
      id
    }
  }
`

const MAX_ORGS = 10
// Fetch a large page to cover all likely selected orgs when filtering client-side
const SELECTED_ORGS_LIMIT = 100

const AdminComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(true)

  // Parse selected org IDs from URL
  const rawOrgs = searchParams.get('orgs')
  const selectedOrgIds: string[] = rawOrgs ? rawOrgs.split(',').filter(Boolean) : []

  // Search query for the org picker dropdown
  const [searchOrgs, { data: searchData, loading: searchLoading }] = useLazyQuery(
    ADMIN_ORGANIZATIONS_QUERY,
    {
      notifyOnNetworkStatusChange: true,
      variables: { limit: 10 },
    },
  )

  const { debouncedSearch, isLoading: isSearchLoading } = useDebouncedSearch(
    searchOrgs,
    searchLoading,
  )

  const searchResults: OrgData[] = searchData?.adminOrganizations?.collection ?? []

  // Fetch selected orgs: use a large-limit query and filter client-side
  const {
    data: selectedData,
    loading: isLoadingOrgs,
    refetch: refetchSelected,
  } = useQuery(ADMIN_ORGANIZATIONS_QUERY, {
    variables: { limit: SELECTED_ORGS_LIMIT },
    skip: selectedOrgIds.length === 0,
    fetchPolicy: 'network-only',
  })

  const allFetchedOrgs: OrgData[] = selectedData?.adminOrganizations?.collection ?? []
  const selectedOrgs: OrgData[] = selectedOrgIds
    .map((id) => allFetchedOrgs.find((o) => o.id === id))
    .filter(Boolean) as OrgData[]

  const [toggleFeature] = useMutation(ADMIN_TOGGLE_FEATURE_MUTATION)

  const addOrg = (org: OrgData) => {
    if (selectedOrgIds.includes(org.id)) return
    if (selectedOrgIds.length >= MAX_ORGS) return
    const next = [...selectedOrgIds, org.id]

    setSearchParams({ orgs: next.join(',') })
  }

  const removeOrg = (orgId: string) => {
    const next = selectedOrgIds.filter((id) => id !== orgId)

    if (next.length === 0) {
      setSearchParams({})
    } else {
      setSearchParams({ orgs: next.join(',') })
    }
  }

  const handleToggle = async (
    orgId: string,
    featureType: string,
    featureKey: string,
    _currentlyEnabled: boolean,
    reason: string,
    notifyOrgAdmin: boolean,
  ) => {
    await toggleFeature({
      variables: {
        input: {
          organizationId: orgId,
          featureKey,
          featureType,
          reason,
          notifyOrgAdmin,
        },
      },
    })
    await refetchSelected()
  }

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: 'Compare Organizations',
          metadata: `Select up to ${MAX_ORGS} organizations to compare features side-by-side`,
        }}
        filtersSection={
          <div className="flex items-center gap-6">
            <div className="relative">
              <SearchInput
                onChange={debouncedSearch}
                placeholder="Search organizations to add..."
              />
              {/* Dropdown results */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 min-w-70 max-h-70 overflow-y-auto rounded-lg border border-grey-300 bg-white shadow-md">
                  {isSearchLoading ? (
                    <div className="flex justify-center py-4">
                      <Spinner />
                    </div>
                  ) : (
                    searchResults
                      .filter((org) => !selectedOrgIds.includes(org.id))
                      .map((org) => (
                        <div
                          key={org.id}
                          className={`border-b border-grey-200 px-4 py-3 last:border-b-0 ${
                            selectedOrgIds.length >= MAX_ORGS
                              ? 'cursor-not-allowed opacity-50'
                              : 'cursor-pointer hover:bg-grey-100'
                          }`}
                          onClick={() => selectedOrgIds.length < MAX_ORGS && addOrg(org)}
                        >
                          <Typography variant="body">{org.name}</Typography>
                          <Typography variant="caption" color="grey600">
                            {org.id}
                          </Typography>
                        </div>
                      ))
                  )}
                  {!isSearchLoading &&
                    searchResults.filter((org) => !selectedOrgIds.includes(org.id)).length ===
                      0 && (
                      <div className="px-4 py-3">
                        <Typography variant="body" color="grey600">
                          No results or all matching orgs are already selected.
                        </Typography>
                      </div>
                    )}
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <Switch
                checked={showDifferencesOnly}
                onChange={(e) => setShowDifferencesOnly(e.target.checked)}
                color="primary"
                size="small"
              />
              <Typography variant="body">Show differences only</Typography>
            </label>
          </div>
        }
      />

      <div className="p-4 md:p-12">
        {/* Selected org chips */}
        {selectedOrgIds.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedOrgIds.map((id) => {
              const org = selectedOrgs.find((o) => o.id === id)

              return (
                <Chip
                  key={id}
                  label={org?.name ?? id}
                  size="small"
                  onDelete={() => removeOrg(id)}
                />
              )
            })}
          </div>
        )}

        {/* Matrix or empty state */}
        {selectedOrgIds.length < 2 && (
          <div className="rounded-xl border border-dashed border-grey-400 py-16 text-center">
            <Typography variant="subhead1" color="grey600">
              Select at least 2 organizations to compare
            </Typography>
            <Typography variant="body" color="grey600" className="mt-2">
              Use the search above to find and add organizations.
            </Typography>
          </div>
        )}
        {selectedOrgIds.length >= 2 && isLoadingOrgs && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {selectedOrgIds.length >= 2 && !isLoadingOrgs && (
          <div className="overflow-x-auto">
            <ComparisonMatrix
              organizations={selectedOrgs}
              showDifferencesOnly={showDifferencesOnly}
              onToggle={handleToggle}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default AdminComparison
