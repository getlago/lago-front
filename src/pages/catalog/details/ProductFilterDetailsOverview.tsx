import { gql } from '@apollo/client'
import { Fragment } from 'react'
import { generatePath } from 'react-router-dom'

import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  ProductCategoryDetailsTabsOptionsEnum,
  ProductDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { Link, PRODUCT_CATEGORY_DETAILS_ROUTE, PRODUCT_DETAILS_ROUTE } from '~/core/router'
import {
  LagoApiError,
  ProductFilterForDrawerFragmentDoc,
  useGetProductFilterForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductFilterDrawer } from '../drawers/productFilter/useProductFilterDrawer'

export const PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID =
  'product-item-filter-details-overview-edit'
export const PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_NO_PRODUCT_CATEGORY_TEST_ID =
  'product-item-filter-details-overview-no-product-category'

gql`
  fragment ProductFilterForDetailsOverview on ProductFilter {
    id
    name
    code
    description
    invoiceDisplayName
    attachedToPlanOrSubscription
    product {
      id
      name
      code
      invoiceDisplayName
      productCategory {
        id
        name
        code
      }
    }
    values {
      id
      key
      value
      billableMetricFilter {
        id
        key
        values
      }
    }
    ...ProductFilterForDrawer
  }

  query getProductFilterForDetailsOverview($id: ID!) {
    productFilter(id: $id) {
      id
      ...ProductFilterForDetailsOverview
    }
  }

  ${ProductFilterForDrawerFragmentDoc}
`

const ProductFilterDetailsOverview = ({ productFilterId }: { productFilterId: string }) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductFilterDrawer } = useProductFilterDrawer()

  const { data, loading } = useGetProductFilterForDetailsOverviewQuery({
    variables: { id: productFilterId },
    skip: !productFilterId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
  const productFilter = data?.productFilter

  if (!productFilter && loading) {
    return <DetailsPage.Skeleton />
  }

  // The details shell redirects on a not-found filter, so render nothing rather
  // than a grid of empty placeholders during that brief window.
  if (!productFilter) {
    return null
  }

  const { product, values } = productFilter

  const attachedProductCategory = product.productCategory ? (
    <Link
      to={generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
        productCategoryId: product.productCategory.id,
        tab: ProductCategoryDetailsTabsOptionsEnum.overview,
      })}
    >
      {product.productCategory.name}
    </Link>
  ) : (
    <span data-test={PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_NO_PRODUCT_CATEGORY_TEST_ID}>
      {translate('text_1784590896872hcbug1hthjl')}
    </span>
  )

  const attachedProduct = (
    <Link
      to={generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: product.id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      })}
    >
      {product.invoiceDisplayName || product.name}
    </Link>
  )

  const code = (
    <TypographyWithCopy variant="body" color="grey700">
      {productFilter.code}
    </TypographyWithCopy>
  )

  const filterBy = values.length ? (
    <div className="flex flex-row flex-wrap items-center gap-2">
      {values.map((value, index) => (
        <Fragment key={value.id}>
          <Chip
            size="small"
            label={
              value.value === null || value.value === undefined
                ? value.key
                : `${value.key}: ${value.value}`
            }
          />
          {index !== values.length - 1 && (
            <Typography variant="body" color="grey700">
              {translate('text_65f8472df7593301061e27d6')}
            </Typography>
          )}
        </Fragment>
      ))}
    </div>
  ) : (
    '-'
  )

  return (
    <section>
      <PageSectionTitle
        title={translate('text_1784590896872mnuossjldco')}
        subtitle={translate('text_17845908968721vd9etj0npq')}
        action={
          hasPermissions(['productFiltersUpdate'])
            ? {
                title: translate('text_625fd39a15394c0117e7d792'),
                dataTest: PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID,
                onClick: () => openEditProductFilterDrawer({ productFilter }),
              }
            : undefined
        }
      />

      <div className="flex flex-col gap-4">
        <DetailsPage.InfoGrid
          grid={[
            { label: translate('text_17839807181143h6kt2bdiyi'), value: attachedProductCategory },
            { label: translate('text_17845790210805g4buh2kivc'), value: attachedProduct },
            { label: translate('text_629728388c4d2300e2d38091'), value: productFilter.name },
            { label: translate('text_629728388c4d2300e2d380b7'), value: code },
          ]}
        />

        {!!productFilter.description && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_6388b923e514213fed58331c')}
            value={productFilter.description}
          />
        )}

        {!!productFilter.invoiceDisplayName && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_65018c8e5c6b626f030bcf26')}
            value={productFilter.invoiceDisplayName}
          />
        )}

        <DetailsPage.InfoGridItem
          className="col-span-2"
          label={translate('text_1784590896872igg2htzgnso')}
          value={filterBy}
        />
      </div>
    </section>
  )
}

export default ProductFilterDetailsOverview
