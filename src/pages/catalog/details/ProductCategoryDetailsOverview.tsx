import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  LagoApiError,
  ProductCategoryForProductCategoryDrawerFragmentDoc,
  useGetProductCategoryForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductCategoryDrawer } from '../drawers/productCategory/useProductCategoryDrawer'

export const PRODUCT_OVERVIEW_EDIT_TEST_ID = 'product-overview-edit'

gql`
  fragment ProductCategoryForProductCategoryDetailsOverview on ProductCategory {
    id
    name
    code
    description
    invoiceDisplayName
    ...ProductCategoryForProductCategoryDrawer
  }

  query getProductCategoryForDetailsOverview($id: ID!) {
    productCategory(id: $id) {
      id
      ...ProductCategoryForProductCategoryDetailsOverview
    }
  }

  ${ProductCategoryForProductCategoryDrawerFragmentDoc}
`

export const ProductCategoryDetailsOverview = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductCategoryDrawer } = useProductCategoryDrawer()
  const { productCategoryId = '' } = useParams()

  const { data, loading } = useGetProductCategoryForDetailsOverviewQuery({
    variables: { id: productCategoryId },
    skip: !productCategoryId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
  const productCategory = data?.productCategory

  if (!productCategory && loading) {
    return <DetailsPage.Skeleton />
  }

  return (
    <section>
      <div className="flex h-18 items-center justify-between gap-4">
        <div className="flex flex-col">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_17836270312826gyudi4ayy2')}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_1783627031283826817cnqcb')}
          </Typography>
        </div>
        {hasPermissions(['productCategoriesUpdate']) && (
          <Button
            variant="inline"
            data-test={PRODUCT_OVERVIEW_EDIT_TEST_ID}
            onClick={() => productCategory && openEditProductCategoryDrawer(productCategory)}
          >
            {translate('text_625fd39a15394c0117e7d792')}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <DetailsPage.InfoGrid
          grid={[
            {
              label: translate('text_17836270312835eta073ys1k'),
              value: productCategory?.name || '-',
            },
            {
              label: translate('text_1783627031283sxwy8pmklj5'),
              value: productCategory?.code ? (
                <TypographyWithCopy variant="body" color="grey700">
                  {productCategory.code}
                </TypographyWithCopy>
              ) : (
                '-'
              ),
            },
          ]}
        />

        {!!productCategory?.description && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_6388b923e514213fed58331c')}
            value={productCategory?.description || '-'}
          />
        )}

        {!!productCategory?.invoiceDisplayName && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_65018c8e5c6b626f030bcf26')}
            value={productCategory?.invoiceDisplayName}
          />
        )}
      </div>
    </section>
  )
}
