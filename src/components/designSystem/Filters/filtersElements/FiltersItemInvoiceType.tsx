import { MultipleComboBox } from '~/components/form'
import { InvoiceTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../FiltersPanelPoper'

type FiltersItemInvoiceTypeProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemInvoiceType = ({ value, setFilterValue }: FiltersItemInvoiceTypeProps) => {
  const { translate } = useInternationalization()

  return (
    <MultipleComboBox
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={Object.values(InvoiceTypeEnum).map((invoiceType) => ({
        value: invoiceType,
      }))}
      onChange={(invoiceType) => {
        setFilterValue(String(invoiceType.map((v) => v.value).join(',')))
      }}
      value={value?.split(',').map((v) => ({ value: v }))}
    />
  )
}
