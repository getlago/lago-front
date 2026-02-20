import { useFilterContext } from '~/components/designSystem/Filters/context'
import { MultipleComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemWebhookHttpStatusesProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

const WEBHOOK_HTTP_STATUS_CATEGORIES = [
  { value: '1xx', label: '1xx' },
  { value: '2xx', label: '2xx' },
  { value: '3xx', label: '3xx' },
  { value: '4xx', label: '4xx' },
  { value: '5xx', label: '5xx' },
  // TODO: Timeout filter not yet supported by the backend
  { value: 'timeout', label: 'Timeout' },
]

export const FiltersItemWebhookHttpStatuses = ({
  value,
  setFilterValue,
}: FiltersItemWebhookHttpStatusesProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilterContext()

  const selectedValues = (value || '')
    .split(',')
    .filter((v) => !!v)
    .map((v) => ({ value: v }))

  const handleChange = (statuses: { value: string }[]) => {
    setFilterValue(statuses.map((v) => v.value).join(','))
  }

  return (
    <MultipleComboBox
      PopperProps={{
        displayInDialog,
      }}
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={WEBHOOK_HTTP_STATUS_CATEGORIES}
      onChange={handleChange}
      value={selectedValues}
    />
  )
}
