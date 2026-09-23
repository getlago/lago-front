import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FiltersItemContractRateOverridesProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemContractRateOverrides = ({
  value,
  setFilterValue,
}: FiltersItemContractRateOverridesProps) => {
  const { translate } = useInternationalization()

  return (
    <ComboBox
      disableClearable
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={[
        {
          value: 'true',
          label: translate('text_1789752288687xjph983ekbt'),
        },
        {
          value: 'false',
          label: translate('text_1789752288687c3bxfx2tjlu'),
        },
      ]}
      onChange={setFilterValue}
      value={value}
    />
  )
}
