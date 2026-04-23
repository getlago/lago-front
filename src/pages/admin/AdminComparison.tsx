import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ComparisonMatrix, OrgData } from '~/components/admin/ComparisonMatrix'
import { Typography } from '~/components/designSystem/Typography'
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
    <Box sx={{ p: 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="headline">Compare Organizations</Typography>
        <Typography variant="body" color="grey600" sx={{ mt: 0.5 }}>
          Select up to {MAX_ORGS} organizations to compare their features side-by-side.
        </Typography>
      </Box>

      {/* Search + controls row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ position: 'relative' }}>
          <SearchInput onChange={debouncedSearch} placeholder="Search organizations to add..." />
          {/* Dropdown results */}
          {searchResults.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                boxShadow: 3,
                maxHeight: 280,
                overflowY: 'auto',
                mt: 0.5,
                minWidth: 280,
              }}
            >
              {isSearchLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                searchResults
                  .filter((org) => !selectedOrgIds.includes(org.id))
                  .map((org) => (
                    <Box
                      key={org.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: selectedOrgIds.length >= MAX_ORGS ? 'not-allowed' : 'pointer',
                        opacity: selectedOrgIds.length >= MAX_ORGS ? 0.5 : 1,
                        '&:hover': {
                          backgroundColor:
                            selectedOrgIds.length >= MAX_ORGS ? undefined : 'action.hover',
                        },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                      onClick={() => selectedOrgIds.length < MAX_ORGS && addOrg(org)}
                    >
                      <Typography variant="body">{org.name}</Typography>
                      <Typography variant="caption" color="grey600">
                        {org.id}
                      </Typography>
                    </Box>
                  ))
              )}
              {!isSearchLoading &&
                searchResults.filter((org) => !selectedOrgIds.includes(org.id)).length === 0 && (
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="body" color="grey600">
                      No results or all matching orgs are already selected.
                    </Typography>
                  </Box>
                )}
            </Box>
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={showDifferencesOnly}
              onChange={(e) => setShowDifferencesOnly(e.target.checked)}
              color="primary"
            />
          }
          label="Show differences only"
          sx={{ ml: 0 }}
        />
      </Box>

      {/* Selected org chips */}
      {selectedOrgIds.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {selectedOrgIds.map((id) => {
            const org = selectedOrgs.find((o) => o.id === id)

            return (
              <Box
                key={id}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 4,
                  backgroundColor: 'primary.50',
                }}
              >
                <Typography variant="caption">{org?.name ?? id}</Typography>
                <Box
                  component="span"
                  sx={{
                    cursor: 'pointer',
                    color: 'text.secondary',
                    lineHeight: 1,
                    fontSize: 16,
                    fontWeight: 700,
                    '&:hover': { color: 'error.main' },
                  }}
                  onClick={() => removeOrg(id)}
                >
                  &times;
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      {/* Matrix or empty state */}
      {selectedOrgIds.length < 2 && (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="subhead1" color="grey600">
            Select at least 2 organizations to compare
          </Typography>
          <Typography variant="body" color="grey600" sx={{ mt: 1 }}>
            Use the search above to find and add organizations.
          </Typography>
        </Box>
      )}
      {selectedOrgIds.length >= 2 && isLoadingOrgs && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {selectedOrgIds.length >= 2 && !isLoadingOrgs && (
        <Box sx={{ overflowX: 'auto' }}>
          <ComparisonMatrix
            organizations={selectedOrgs}
            showDifferencesOnly={showDifferencesOnly}
            onToggle={handleToggle}
          />
        </Box>
      )}
    </Box>
  )
}

export default AdminComparison
