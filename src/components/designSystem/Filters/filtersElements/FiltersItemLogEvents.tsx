import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { MultipleComboBox } from '~/components/form'
import { LogEventEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemLogEventsProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemLogEvents = ({ value, setFilterValue }: FiltersItemLogEventsProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  return (
    <MultipleComboBox
      PopperProps={{
        displayInDialog,
      }}
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={Object.values(LogEventEnum).map((logEvent) => ({
        label: logEvent,
        value: logEvent,
      }))}
      onChange={(invoiceType) => {
        setFilterValue(String(invoiceType.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => ({ value: v }))}
    />
  )
}
