import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { computeCustomerName } from '~/components/customers/utils'
import { ComboBox } from '~/components/form'
import { useGetCustomersForFilterItemCustomerLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../FiltersPanelPoper'
import { filterDataInlineSeparator } from '../types'

gql`
  query getCustomersForFilterItemCustomer($page: Int, $limit: Int, $searchTerm: String) {
    customers(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        displayName
        externalId
      }
    }
  }
`

type FiltersItemCustomerProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemCustomer = ({ value, setFilterValue }: FiltersItemCustomerProps) => {
  const { translate } = useInternationalization()
  const [getCustomers, { data, loading }] = useGetCustomersForFilterItemCustomerLazyQuery({
    variables: { page: 1, limit: 10 },
  })

  const comboboxCustomersData = useMemo(() => {
    if (!data?.customers?.collection) return []

    return data.customers.collection.map((customer) => {
      const { externalId } = customer

      const customerName = computeCustomerName(customer)

      return {
        label: customerName || '',
        value: `${externalId}${filterDataInlineSeparator}${customerName}`,
      }
    })
  }, [data])

  return (
    <ComboBox
      disableClearable
      searchQuery={getCustomers}
      loading={loading}
      placeholder={translate('text_63befc65efcd9374da45b801')}
      data={comboboxCustomersData}
      onChange={(customerValue) => setFilterValue(customerValue)}
      value={value}
    />
  )
}
