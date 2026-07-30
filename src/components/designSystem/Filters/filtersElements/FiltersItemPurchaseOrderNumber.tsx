import { TextInput } from '~/components/form'
import {
  PURCHASE_ORDER_NUMBER_MAX_LENGTH,
  PURCHASE_ORDER_TRANSLATIONS,
} from '~/components/purchaseOrder/constants'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemPurchaseOrderNumberProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemPurchaseOrderNumber = ({
  value,
  setFilterValue,
}: FiltersItemPurchaseOrderNumberProps) => {
  const { translate } = useInternationalization()

  return (
    <TextInput
      placeholder={translate(PURCHASE_ORDER_TRANSLATIONS.placeholder)}
      value={value}
      onChange={(val) => setFilterValue(val)}
      inputProps={{ maxLength: PURCHASE_ORDER_NUMBER_MAX_LENGTH }}
    />
  )
}
