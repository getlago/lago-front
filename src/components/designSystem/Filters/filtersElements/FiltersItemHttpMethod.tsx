import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { MultipleComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemHttpMethodProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// TODO: Add enum when available
const HTTP_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
]

export const FiltersItemHttpMethod = ({ value, setFilterValue }: FiltersItemHttpMethodProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  return (
    <MultipleComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={HTTP_METHODS.map((method) => ({
        value: method.value,
        label: translate(method.label),
      }))}
      onChange={(reasons) => {
        setFilterValue(String(reasons.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => ({ value: v }))}
    />
  )
}
