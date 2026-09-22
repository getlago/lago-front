import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { useFilters } from '~/components/Filters/graphql/useFilters'
import { escapeFilterLabel } from '~/components/Filters/graphql/utils'
import {
  filterDataInlineSeparator,
  FiltersFormValues,
} from '~/components/Filters/presentation/types'
import { ComboBox, ComboboxItem } from '~/components/form'
import { useGetCatalogPlansForFiltersItemContractPlanLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getCatalogPlansForFiltersItemContractPlan($page: Int, $limit: Int, $searchTerm: String) {
    catalogPlans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        name
        code
      }
    }
  }
`

type FiltersItemContractPlanProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemContractPlan = ({
  value,
  setFilterValue,
}: FiltersItemContractPlanProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()
  const [getCatalogPlans, { data, loading }] =
    useGetCatalogPlansForFiltersItemContractPlanLazyQuery({
      variables: { page: 1, limit: 10 },
    })

  const plans = useMemo(
    () =>
      (data?.catalogPlans.collection ?? []).map((plan) => ({
        label: plan.name,
        labelNode: (
          <ComboboxItem>
            <Typography variant="body" color="grey700" noWrap>
              {plan.name}
            </Typography>
            <Typography variant="caption" color="grey600" noWrap>
              {plan.code}
            </Typography>
          </ComboboxItem>
        ),
        value: `${plan.code}${filterDataInlineSeparator}${escapeFilterLabel(plan.name)}`,
      })),
    [data?.catalogPlans.collection],
  )

  return (
    <ComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      searchQuery={getCatalogPlans}
      loading={loading}
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={plans}
      onChange={setFilterValue}
      value={value}
    />
  )
}
