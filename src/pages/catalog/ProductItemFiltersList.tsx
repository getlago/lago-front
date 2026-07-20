import { gql } from '@apollo/client'

import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ProductItemFilterForList on ProductItemFilter {
    id
    name
    code
    invoiceDisplayName
    createdAt
    attachedToPlanOrSubscription
    productItem {
      id
      name
      invoiceDisplayName
    }
    ...ProductItemFilterForDrawer
    ...ProductItemFilterForDeleteProductItemFilterDialog
  }
`

export const PRODUCT_ITEM_FILTERS_LIST_TEST_ID = 'product-item-filters-list'

const ProductItemFiltersList = () => {
  const { translate } = useInternationalization()

  return (
    <div className="p-4" data-test={PRODUCT_ITEM_FILTERS_LIST_TEST_ID}>
      {translate('text_1783104239825gamldgumtq0')}
    </div>
  )
}

export default ProductItemFiltersList
