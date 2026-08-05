import { useMemo } from 'react'

import {
  formatMultiFilterValue,
  parseMultiFilterValue,
} from '~/components/Filters/graphql/filtersElements/utils'
import { useFilterContext } from '~/components/Filters/presentation/context'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useWebhookEventTypes } from '~/hooks/useWebhookEventTypes'

type FiltersItemWebhookEventTypesProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemWebhookEventTypes = ({
  value,
  setFilterValue,
}: FiltersItemWebhookEventTypesProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilterContext()
  const { allEventNames } = useWebhookEventTypes()

  const eventTypeOptions = useMemo(
    () =>
      allEventNames.map((eventType) => ({
        label: eventType,
        value: eventType,
      })),
    [allEventNames],
  )

  return (
    <MultipleComboBox
      PopperProps={{
        displayInDialog,
      }}
      disableClearable
      disableCloseOnSelect
      sortValues={false}
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={eventTypeOptions}
      onChange={(eventTypes) => setFilterValue(formatMultiFilterValue(eventTypes))}
      value={parseMultiFilterValue(value)}
    />
  )
}
