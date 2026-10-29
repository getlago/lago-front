import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { useFilters } from '~/components/Filters/graphql/useFilters'
import { escapeFilterLabel, unescapeFilterLabel } from '~/components/Filters/graphql/utils'
import {
  filterDataInlineSeparator,
  FiltersFormValues,
} from '~/components/Filters/presentation/types'
import { ComboBox, ComboboxItem, TextInput } from '~/components/form'
import { useGetSubscriptionsForFilterItemSubscriptionLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

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

const buildOption = (externalId: string, label: string) => ({
  label,
  labelNode: (
    <ComboboxItem>
      <Typography variant="body" color="grey700" noWrap>
        {label}
      </Typography>
    </ComboboxItem>
  ),
  value: `${externalId}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
})

export const FiltersItemSubscription = ({
  value,
  setFilterValue,
}: FiltersItemSubscriptionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

  // The search reads `subscriptions`, which members without this permission cannot query.
  if (!hasPermissions(['subscriptionsView'])) {
    return (
      <TextInput
        placeholder={translate('text_1741014096283pwl7a5oa69a')}
        value={value?.split(filterDataInlineSeparator)[0]}
        onChange={setFilterValue}
      />
    )
  }

  return <FiltersItemSubscriptionComboBox value={value} setFilterValue={setFilterValue} />
}

const FiltersItemSubscriptionComboBox = ({
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
    const [selectedExternalId, selectedLabel] = value?.split(filterDataInlineSeparator) || []

    // One external id can name several subscriptions over time, and the filter reads them all.
    const seen = new Set<string>(selectedExternalId ? [selectedExternalId] : [])

    const options = (data?.subscriptions?.collection || []).flatMap((subscription) => {
      if (seen.has(subscription.externalId)) return []
      seen.add(subscription.externalId)

      const label = [subscription.externalId, subscription.customer.displayName]
        .filter(Boolean)
        .join(' - ')

      return [buildOption(subscription.externalId, label)]
    })

    if (!value || !selectedExternalId) return options

    // Also covers a raw id, stored while this filter was a text input.
    const selectedOption = buildOption(
      selectedExternalId,
      unescapeFilterLabel(selectedLabel || selectedExternalId),
    )

    return [{ ...selectedOption, value }, ...options]
  }, [data?.subscriptions?.collection, value])

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
