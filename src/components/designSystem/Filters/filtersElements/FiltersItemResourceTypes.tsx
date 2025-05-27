import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { MultipleComboBox } from '~/components/form'
import { ResourceTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemResourceTypesProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemResourceTypes = ({
  value,
  setFilterValue,
}: FiltersItemResourceTypesProps) => {
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
      data={[
        {
          label: translate('text_64352657267c3d916f962757'),
          value: ResourceTypeEnum.BillableMetric,
        },
        {
          label: translate('text_1743077296189ms0shds6g53'),
          value: ResourceTypeEnum.BillingEntity,
        },
        {
          label: translate('text_628b8c693e464200e00e4677'),
          value: ResourceTypeEnum.Coupon,
        },
        {
          label: translate('text_1748341883774iypsrgem3hr'),
          value: ResourceTypeEnum.CreditNote,
        },
        {
          label: translate('text_65201c5a175a4b0238abf29a'),
          value: ResourceTypeEnum.Customer,
        },
        {
          label: translate('text_63fcc3218d35b9377840f5b3'),
          value: ResourceTypeEnum.Invoice,
        },
        {
          label: translate('text_63d3a658c6d84a5843032145'),
          value: ResourceTypeEnum.Plan,
        },
        {
          label: translate('text_1728472697691k6k2e9m5ibb'),
          value: ResourceTypeEnum.Subscription,
        },
        {
          label: translate('text_62d175066d2dbf1d50bc9384'),
          value: ResourceTypeEnum.Wallet,
        },
      ]}
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
