import { useMemo } from 'react'

import { ComboBox } from '~/components/form'
import { ProductItemTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemProductItemTypeProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

const productItemTypeMapping = (itemType: ProductItemTypeEnum): string => {
  switch (itemType) {
    case ProductItemTypeEnum.Fixed:
      return 'text_1783980718113ritmy7z94je'
    case ProductItemTypeEnum.Usage:
      return 'text_17839807181133l3z83156s6'
    default:
      return ''
  }
}

export const FiltersItemProductItemType = ({
  value,
  setFilterValue,
}: FiltersItemProductItemTypeProps) => {
  const { translate } = useInternationalization()

  const options = useMemo(
    () =>
      Object.values(ProductItemTypeEnum).map((itemType) => ({
        value: itemType,
        label: translate(productItemTypeMapping(itemType)),
      })),
    [translate],
  )

  return (
    <ComboBox
      disableClearable
      placeholder={translate('text_1783980718113lap636bt33b')}
      data={options}
      onChange={(itemType) => setFilterValue(itemType)}
      value={value}
    />
  )
}
