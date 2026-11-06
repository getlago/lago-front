import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { InvoiceProductCatalogSectionItem } from './useInvoiceProductFees'

export type InvoiceProductCatalogTab = {
  key: string
  label: string
}

const getContractLabel = ({ contract }: InvoiceProductCatalogSectionItem): string =>
  contract.name || contract.plan?.invoiceDisplayName || contract.plan?.name || contract.externalId

const getCategoryLabel = (
  { productCategory }: InvoiceProductCatalogSectionItem,
  translate: TranslateFunc,
): string => {
  if (!productCategory) return translate('text_17918333668416t409ijtqn3')

  return productCategory.invoiceDisplayName || productCategory.name
}

export const buildInvoiceProductCatalogTabs = (
  sections: InvoiceProductCatalogSectionItem[],
  translate: TranslateFunc,
): InvoiceProductCatalogTab[] => {
  const hasSeveralContracts = new Set(sections.map(({ contract }) => contract.id)).size > 1
  const hasCategories = sections.some(({ productCategory }) => !!productCategory)

  const getLabel = (section: InvoiceProductCatalogSectionItem): string => {
    if (!hasSeveralContracts) return getCategoryLabel(section, translate)
    if (!hasCategories) return getContractLabel(section)

    return translate('text_1793957142587cgaevt98s5y', {
      contract: getContractLabel(section),
      category: getCategoryLabel(section, translate),
    })
  }

  return sections.map((section) => ({ key: section.key, label: getLabel(section) }))
}
