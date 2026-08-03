import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { MultipleComboBox } from '~/components/form'
import { useGetAdminOrganizationsForFilterItemQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { filterDataInlineSeparator, FiltersFormValues } from '../types'
import { escapeFilterLabel, unescapeFilterLabel } from '../utils'

const ORGANIZATIONS_LIMIT = 500

gql`
  query getAdminOrganizationsForFilterItem($limit: Int) {
    adminOrganizations(limit: $limit) {
      collection {
        id
        name
      }
    }
  }
`

type FiltersItemAdminOrganizationsProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemAdminOrganizations = ({
  value,
  setFilterValue,
}: FiltersItemAdminOrganizationsProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()
  const { data, loading } = useGetAdminOrganizationsForFilterItemQuery({
    variables: { limit: ORGANIZATIONS_LIMIT },
  })

  const comboboxOrganizationsData = useMemo(() => {
    if (!data?.adminOrganizations?.collection) return []

    return data.adminOrganizations.collection.map((organization) => {
      const label = organization.name ?? organization.id

      return {
        label,
        value: `${organization.id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
      }
    })
  }, [data?.adminOrganizations?.collection])

  return (
    <MultipleComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      disableCloseOnSelect
      loading={loading}
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={comboboxOrganizationsData}
      onChange={(organizations) => {
        setFilterValue(String(organizations.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => ({
          label: unescapeFilterLabel(v.split(filterDataInlineSeparator)[1] ?? ''),
          value: v,
        }))}
    />
  )
}
