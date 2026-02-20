import { useMemo } from 'react'

import { useFilterContext } from '~/components/designSystem/Filters/context'
import { MultipleComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useWebhookEventTypes } from '~/hooks/useWebhookEventTypes'

import { FiltersFormValues } from '../types'

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

  const selectedValues = (value || '')
    .split(',')
    .filter((v) => !!v)
    .map((v) => ({ value: v }))

  const handleChange = (eventTypes: { value: string }[]) => {
    setFilterValue(eventTypes.map((v) => v.value).join(','))
  }

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
      onChange={handleChange}
      value={selectedValues}
    />
  )
}
