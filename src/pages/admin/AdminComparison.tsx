import { gql, useMutation, useQuery } from '@apollo/client'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ComparisonMatrix, OrgData } from '~/components/admin/ComparisonMatrix'
import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { MultipleComboBox } from '~/components/form/MultipleComboBox/MultipleComboBox'
import {
  BasicMultipleComboBoxData,
  MultipleComboBoxData,
} from '~/components/form/MultipleComboBox/types'
import { Switch } from '~/components/form/Switch/Switch'
import { MainHeader } from '~/components/MainHeader/MainHeader'

const ADMIN_ORGANIZATIONS_QUERY = gql`
  query AdminOrganizationsComparison($limit: Int) {
    adminOrganizations(limit: $limit) {
      collection {
        id
        name
        premiumIntegrations
        featureFlags
        createdAt
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
const ALL_ORGS_LIMIT = 500

const AdminComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(true)

  // Parse selected org IDs from URL
  const rawOrgs = searchParams.get('orgs')
  const selectedOrgIds: string[] = rawOrgs ? rawOrgs.split(',').filter(Boolean) : []

  // Fetch all orgs in a single query
  const {
    data,
    loading: isLoadingOrgs,
    refetch,
  } = useQuery(ADMIN_ORGANIZATIONS_QUERY, {
    variables: { limit: ALL_ORGS_LIMIT },
  })

  const allOrgs: OrgData[] = data?.adminOrganizations?.collection ?? []

  const selectedOrgs: OrgData[] = selectedOrgIds
    .map((id) => allOrgs.find((o) => o.id === id))
    .filter(Boolean) as OrgData[]

  // Build combobox data from all orgs
  const comboBoxData = useMemo(
    () => allOrgs.map((org) => ({ value: org.id, label: org.name })),
    [allOrgs],
  )

  const comboBoxValue = useMemo(
    () =>
      selectedOrgIds
        .map((id) => {
          const org = allOrgs.find((o) => o.id === id)

          return org ? { value: org.id, label: org.name } : null
        })
        .filter(Boolean) as BasicMultipleComboBoxData[],
    [selectedOrgIds, allOrgs],
  )

  const [toggleFeature] = useMutation(ADMIN_TOGGLE_FEATURE_MUTATION)

  const handleOrgSelectionChange = (newValue: MultipleComboBoxData[]) => {
    const ids = newValue.map((item) => item.value)

    if (ids.length === 0) {
      setSearchParams({})
    } else {
      setSearchParams({ orgs: ids.join(',') })
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
    await refetch()
  }

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: 'Compare Organizations',
          metadata: `Select up to ${MAX_ORGS} organizations to compare features side-by-side`,
        }}
      />

      <div className="p-4 md:p-12">
        {/* Org selector + controls */}
        <div className="mb-6 flex items-center gap-6">
          <div className="w-120">
            <MultipleComboBox
              placeholder="Search organizations to add..."
              data={comboBoxData}
              value={comboBoxValue}
              loading={isLoadingOrgs}
              onChange={handleOrgSelectionChange}
              limitTags={MAX_ORGS}
              showOptionsOnlyWhenTyping
            />
          </div>

          <Switch
            name="showDifferencesOnly"
            checked={showDifferencesOnly}
            onChange={(value) => setShowDifferencesOnly(value)}
            label="Show differences only"
          />
        </div>

        {/* Matrix or empty state */}
        {selectedOrgs.length < 2 && (
          <div className="rounded-xl border border-dashed border-grey-400 py-16 text-center">
            <Typography variant="subhead1" color="grey600">
              Select at least 2 organizations to compare
            </Typography>
            <Typography variant="body" color="grey600" className="mt-2">
              Use the search above to find and add organizations.
            </Typography>
          </div>
        )}
        {selectedOrgs.length >= 2 && isLoadingOrgs && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {selectedOrgs.length >= 2 && !isLoadingOrgs && (
          <ComparisonMatrix
            organizations={selectedOrgs}
            showDifferencesOnly={showDifferencesOnly}
            onToggle={handleToggle}
          />
        )}
      </div>
    </>
  )
}

export default AdminComparison
