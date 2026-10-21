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
import { useGetSubscriptionsForFilterItemSubscriptionLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getSubscriptionsForFilterItemSubscription($page: Int, $limit: Int, $searchTerm: String) {
    subscriptions(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        externalId
        customer {
          id
          displayName
        }
      }
    }
  }
`

type FiltersItemSubscriptionProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemSubscription = ({
  value,
  setFilterValue,
}: FiltersItemSubscriptionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const [getSubscriptions, { data, loading }] =
    useGetSubscriptionsForFilterItemSubscriptionLazyQuery({
      variables: { page: 1, limit: 10 },
    })

  const comboboxData = useMemo(() => {
    if (!data?.subscriptions?.collection) return []

    // One external id can name several subscriptions over time, and the filter reads them all.
    const seen = new Set<string>()

    return data.subscriptions.collection.flatMap((subscription) => {
      if (seen.has(subscription.externalId)) return []
      seen.add(subscription.externalId)

      const label = [subscription.externalId, subscription.customer.displayName]
        .filter(Boolean)
        .join(' - ')

      return [
        {
          label,
          labelNode: (
            <ComboboxItem>
              <Typography variant="body" color="grey700" noWrap>
                {label}
              </Typography>
            </ComboboxItem>
          ),
          value: `${subscription.externalId}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
        },
      ]
    })
  }, [data?.subscriptions?.collection])

  return (
    <ComboBox
      PopperProps={{
        displayInDialog,
      }}
      disableClearable
      searchQuery={getSubscriptions}
      loading={loading}
      placeholder={translate('text_1792500580727qzy8yr8g3po')}
      data={comboboxData}
      onChange={setFilterValue}
      value={value}
    />
  )
}
