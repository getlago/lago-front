import { gql } from '@apollo/client'
import { Fragment } from 'react'
import { generatePath } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  ProductDetailsTabsOptionsEnum,
  ProductItemDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { Link, PRODUCT_DETAILS_ROUTE, PRODUCT_ITEM_DETAILS_ROUTE } from '~/core/router'
import {
  LagoApiError,
  ProductItemFilterForDrawerFragmentDoc,
  useGetProductItemFilterForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductItemFilterDrawer } from '../drawers/productItemFilter/useProductItemFilterDrawer'

export const PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID =
  'product-item-filter-details-overview-edit'
export const PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_NO_PRODUCT_TEST_ID =
  'product-item-filter-details-overview-no-product'

gql`
  fragment ProductItemFilterForDetailsOverview on ProductItemFilter {
    id
    name
    code
    description
    invoiceDisplayName
    attachedToPlanOrSubscription
    productItem {
      id
      name
      code
      invoiceDisplayName
      product {
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
    ...ProductItemFilterForDrawer
  }

  query getProductItemFilterForDetailsOverview($id: ID!) {
    productItemFilter(id: $id) {
      id
      ...ProductItemFilterForDetailsOverview
    }
  }

  ${ProductItemFilterForDrawerFragmentDoc}
`

const ProductItemFilterDetailsOverview = ({
  productItemFilterId,
}: {
  productItemFilterId: string
}) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductItemFilterDrawer } = useProductItemFilterDrawer()

  const { data, loading } = useGetProductItemFilterForDetailsOverviewQuery({
    variables: { id: productItemFilterId },
    skip: !productItemFilterId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
  const productItemFilter = data?.productItemFilter

  if (!productItemFilter && loading) {
    return <DetailsPage.Skeleton />
  }

  // The details shell redirects on a not-found filter, so render nothing rather
  // than a grid of empty placeholders during that brief window.
  if (!productItemFilter) {
    return null
  }

  const { productItem, values } = productItemFilter

  const attachedProduct = productItem.product ? (
    <Link
      to={generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: productItem.product.id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      })}
    >
      <Typography variant="body" color="grey700">
        {productItem.product.name}
      </Typography>
    </Link>
  ) : (
    <Typography
      data-test={PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_NO_PRODUCT_TEST_ID}
      variant="body"
      color="grey700"
    >
      {translate('text_1784590896872hcbug1hthjl')}
    </Typography>
  )

  const attachedProductItem = (
    <Link
      to={generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
        productItemId: productItem.id,
        tab: ProductItemDetailsTabsOptionsEnum.overview,
      })}
    >
      <Typography variant="body" color="grey700">
        {productItem.invoiceDisplayName || productItem.name}
      </Typography>
    </Link>
  )

  const code = (
    <TypographyWithCopy variant="body" color="grey700">
      {productItemFilter.code}
    </TypographyWithCopy>
  )

  const filterBy = values.length ? (
    <div className="flex flex-row flex-wrap items-center gap-2">
      {values.map((value, index) => (
        <Fragment key={value.id}>
          <Chip size="small" label={`${value.key}: ${value.value}`} />
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
      <div className="flex h-18 items-center justify-between gap-4">
        <div className="flex flex-col">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_1784590896872mnuossjldco')}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_17845908968721vd9etj0npq')}
          </Typography>
        </div>
        {hasPermissions(['productItemFiltersUpdate']) && (
          <Button
            variant="inline"
            data-test={PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID}
            onClick={() => openEditProductItemFilterDrawer({ productItemFilter })}
          >
            {translate('text_625fd39a15394c0117e7d792')}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <DetailsPage.InfoGrid
          grid={[
            { label: translate('text_17839807181143h6kt2bdiyi'), value: attachedProduct },
            { label: translate('text_17845790210805g4buh2kivc'), value: attachedProductItem },
            { label: translate('text_629728388c4d2300e2d38091'), value: productItemFilter.name },
            { label: translate('text_629728388c4d2300e2d380b7'), value: code },
          ]}
        />

        {!!productItemFilter.description && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_6388b923e514213fed58331c')}
            value={productItemFilter.description}
          />
        )}

        {!!productItemFilter.invoiceDisplayName && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_65018c8e5c6b626f030bcf26')}
            value={productItemFilter.invoiceDisplayName}
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

export default ProductItemFilterDetailsOverview
