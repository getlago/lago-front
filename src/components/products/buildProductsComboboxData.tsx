import { ReactNode } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { ComboboxDataGrouped } from '~/components/form/ComboBox'
import { getDisplayName } from '~/components/invoices/productCatalog/formatInvoiceProductFees'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

const STANDALONE_PRODUCTS_GROUP_KEY = 'standalone-products'

export type ProductForComboboxData = {
  id: string
  name: string
  code: string
  invoiceDisplayName?: string | null
  productCategory?: { code: string; name: string; invoiceDisplayName?: string | null } | null
}

type BuildProductsComboboxDataOptions = {
  valueKey?: 'id' | 'code'
  isProductDisabled?: (value: string) => boolean
  standaloneHeader?: { titleKey: string; captionKey: string }
}

export const buildProductsComboboxData = (
  products: ProductForComboboxData[],
  translate: TranslateFunc,
  {
    valueKey = 'id',
    isProductDisabled,
    standaloneHeader = {
      titleKey: 'text_1791833366841w7sywhfkvcq',
      captionKey: 'text_17918333668416t409ijtqn3',
    },
  }: BuildProductsComboboxDataOptions = {},
): { data: ComboboxDataGrouped[]; renderGroupHeader: Record<string, ReactNode> } => {
  const renderGroupHeader: Record<string, ReactNode> = {}

  const data = products.map((product) => {
    const category = product.productCategory
    const group = category?.code ?? STANDALONE_PRODUCTS_GROUP_KEY

    if (!renderGroupHeader[group]) {
      renderGroupHeader[group] = (
        <div className="flex items-center gap-1">
          <Typography variant="captionHl" color="grey700" noWrap>
            {category ? getDisplayName(category) : translate(standaloneHeader.titleKey)}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {category ? category.code : `• ${translate(standaloneHeader.captionKey)}`}
          </Typography>
        </div>
      )
    }

    return {
      value: product[valueKey],
      label: category
        ? translate('text_1791833366841uuvaufyxeoc', {
            productName: getDisplayName(product),
            productCategoryName: getDisplayName(category),
          })
        : getDisplayName(product),
      labelNode: product.name,
      description: product.code,
      ...(isProductDisabled && { disabled: isProductDisabled(product[valueKey]) }),
      group,
    }
  })

  return { data, renderGroupHeader }
}
