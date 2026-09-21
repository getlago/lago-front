import { useMemo } from 'react'

import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { ContractStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FiltersItemContractStatusProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const contractStatusTranslation = (status: ContractStatusEnum): string => {
  switch (status) {
    case ContractStatusEnum.Active:
      return 'text_624efab67eb2570101d1180e'
    case ContractStatusEnum.Pending:
      return 'text_1734774653389j2meo530xlb'
    case ContractStatusEnum.Canceled:
      return 'text_17429854230668s8zhn9ujq6'
    case ContractStatusEnum.Terminated:
      return 'text_62e2a2f2a79d60429eff3035'
  }
}

export const FiltersItemContractStatus = ({
  value,
  setFilterValue,
}: FiltersItemContractStatusProps) => {
  const { translate } = useInternationalization()
  const options = useMemo(
    () =>
      Object.values(ContractStatusEnum).map((status) => ({
        value: status,
        label: translate(contractStatusTranslation(status)),
      })),
    [translate],
  )

  return (
    <MultipleComboBox
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={options}
      onChange={(statuses) => setFilterValue(statuses.map((status) => status.value).join(','))}
      value={value
        ?.split(',')
        .filter(Boolean)
        .map((status) => ({ value: status }))}
    />
  )
}
