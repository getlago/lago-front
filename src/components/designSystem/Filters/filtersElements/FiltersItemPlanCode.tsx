import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { ComboBox } from '~/components/form'
import { useGetPlansForFiltersItemPlanCodeLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

gql`
  query getPlansForFiltersItemPlanCode($page: Int, $limit: Int, $searchTerm: String) {
    plans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        code
      }
    }
  }
`

type FiltersItemPlanCodeProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemPlanCode = ({ value, setFilterValue }: FiltersItemPlanCodeProps) => {
  const { translate } = useInternationalization()
  const [getPlans, { data, loading }] = useGetPlansForFiltersItemPlanCodeLazyQuery({
    variables: { page: 1, limit: 10 },
  })

  const comboboxPlansData = useMemo(() => {
    if (!data?.plans?.collection) return []

    return data.plans.collection.map((plan) => ({
      value: plan.code,
    }))
  }, [data])

  return (
    <ComboBox
      disableClearable
      searchQuery={getPlans}
      loading={loading}
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={comboboxPlansData}
      onChange={(planValue) => setFilterValue(planValue)}
      value={value}
    />
  )
}
