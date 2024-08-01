import { MultipleComboBox } from '~/components/form'
import { InvoiceStatusTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../FiltersPanelPoper'

type FiltersItemStatusProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemStatus = ({ value, setFilterValue }: FiltersItemStatusProps) => {
  const { translate } = useInternationalization()

  return (
    <MultipleComboBox
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={Object.values(InvoiceStatusTypeEnum).map((status) => ({
        value: status,
      }))}
      onChange={(status) => {
        setFilterValue(String(status.map((v) => v.value).join(',')))
      }}
      value={value?.split(',').map((v) => ({ value: v }))}
    />
  )
}
