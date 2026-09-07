import { paymentTypeLabels } from '~/components/Filters/graphql/paymentFilterValues'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { PaymentTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type Props = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemPaymentType = ({ value, setFilterValue }: Props) => {
  const { translate } = useInternationalization()

  const options = Object.values(PaymentTypeEnum).map((option) => ({
    value: option,
    label: translate(paymentTypeLabels[option]),
  }))

  return (
    <MultipleComboBox
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={options}
      value={options.filter((option) => (value || '').split(',').includes(option.value))}
      onChange={(selectedOptions) =>
        setFilterValue(selectedOptions.map((option) => option.value).join(','))
      }
    />
  )
}
