import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type Props = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemPaymentInvoiceNumber = ({ value, setFilterValue }: Props) => {
  const { translate } = useInternationalization()

  return (
    <TextInput
      placeholder={translate('text_1788818972605eo3hbuoc2kk')}
      value={value}
      onChange={setFilterValue}
      inputProps={{ maxLength: 255 }}
    />
  )
}
