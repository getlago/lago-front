import { useMemo } from 'react'

import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { ComboBox } from '~/components/form'
import { ProductTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FiltersItemProductTypeProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

const productTypeMapping = (productType: ProductTypeEnum): string => {
  switch (productType) {
    case ProductTypeEnum.Fixed:
      return 'text_1783980718113ritmy7z94je'
    case ProductTypeEnum.Usage:
      return 'text_17839807181133l3z83156s6'
    default:
      return ''
  }
}

export const FiltersItemProductType = ({ value, setFilterValue }: FiltersItemProductTypeProps) => {
  const { translate } = useInternationalization()

  const options = useMemo(
    () =>
      Object.values(ProductTypeEnum).map((productType) => ({
        value: productType,
        label: translate(productTypeMapping(productType)),
      })),
    [translate],
  )

  return (
    <ComboBox
      disableClearable
      placeholder={translate('text_1783980718113lap636bt33b')}
      data={options}
      onChange={(productType) => setFilterValue(productType)}
      value={value}
    />
  )
}
