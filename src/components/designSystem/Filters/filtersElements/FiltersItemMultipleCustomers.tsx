import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { Typography } from '~/components/designSystem/Typography'
import { ComboboxItem, MultipleComboBox } from '~/components/form'
import { useGetCustomersForFilterItemMultipleCustomersLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { filterDataInlineSeparator, FiltersFormValues } from '../types'

gql`
  query getCustomersForFilterItemMultipleCustomers(
    $page: Int
    $limit: Int
    $searchTerm: String
  ) {
    customers(page: $page, limit: $limit, searchTerm: $searchTerm, withDeleted: true) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        displayName
        externalId
        deletedAt
      }
    }
  }
`

type FiltersItemMultipleCustomersProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemMultipleCustomers = ({
  value,
  setFilterValue,
}: FiltersItemMultipleCustomersProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const [getCustomers, { data, loading }] =
    useGetCustomersForFilterItemMultipleCustomersLazyQuery({
      variables: { page: 1, limit: 10 },
    })

  const comboboxCustomersData = useMemo(() => {
    if (!data?.customers?.collection) return []

    return data.customers.collection.map((customer) => {
      const { externalId } = customer
      const customerName = customer?.displayName

      return {
        label: `${customerName || externalId || ''}${customer.deletedAt ? ` (${translate('text_1743158702704o1juwxmr4ab')})` : ''}`,
        labelNode: (
          <ComboboxItem>
            <Typography variant="body" color="grey700" noWrap>
              {customerName || externalId || ''}
            </Typography>
            {customer.deletedAt && (
              <Typography variant="caption" color="grey600" noWrap>
                {` (${translate('text_1743158702704o1juwxmr4ab')})`}
              </Typography>
            )}
          </ComboboxItem>
        ),
        value: `${externalId}${filterDataInlineSeparator}${customerName}`,
      }
    })
  }, [data?.customers?.collection, translate])

  return (
    <MultipleComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      disableCloseOnSelect
      searchQuery={getCustomers}
      loading={loading}
      placeholder={translate('text_63befc65efcd9374da45b801')}
      data={comboboxCustomersData}
      onChange={(customers) => {
        setFilterValue(String(customers.map((v) => v.value).join(',')))
      }}
      value={(value ?? '')
        .split(',')
        .filter((v) => !!v)
        .map((v) => ({
          label:
            v.split(filterDataInlineSeparator)[1] || v.split(filterDataInlineSeparator)[0],
          value: v,
        }))}
    />
  )
}
