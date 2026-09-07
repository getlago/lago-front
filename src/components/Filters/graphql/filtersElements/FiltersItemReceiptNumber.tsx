import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type Props = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemReceiptNumber = ({ value, setFilterValue }: Props) => {
  const { translate } = useInternationalization()

  return (
    <TextInput
      placeholder={translate('text_17888189726051suqmb5jpa8')}
      value={value}
      onChange={setFilterValue}
      inputProps={{ maxLength: 255 }}
    />
  )
}
