import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'

import {
  MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT,
  ShowMoreText,
} from '~/components/designSystem/ShowMoreText'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  BillableMetricDetailsTabsOptionsEnum,
  ProductCategoryDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { BILLABLE_METRIC_DETAILS_ROUTE, Link, PRODUCT_CATEGORY_DETAILS_ROUTE } from '~/core/router'
import {
  LagoApiError,
  ProductForDrawerFragmentDoc,
  ProductTypeEnum,
  useGetProductForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductDrawer } from '../drawers/product/useProductDrawer'

export const PRODUCT_ITEM_OVERVIEW_EDIT_TEST_ID = 'product-item-overview-edit'

const ITEM_TYPE_TRANSLATION_KEY: Record<ProductTypeEnum, string> = {
  [ProductTypeEnum.Fixed]: 'text_1783980718113ritmy7z94je',
  [ProductTypeEnum.Usage]: 'text_17839807181133l3z83156s6',
}

gql`
  fragment ProductForDetailsOverview on Product {
    id
    name
    code
    description
    invoiceDisplayName
    productType
    productCategory {
      id
      name
      code
    }
    billableMetric {
      id
      name
      code
    }
    ...ProductForDrawer
  }

  query getProductForDetailsOverview($id: ID!) {
    product(id: $id) {
      id
      ...ProductForDetailsOverview
    }
  }

  ${ProductForDrawerFragmentDoc}
`

export const ProductDetailsOverview = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductDrawer } = useProductDrawer()
  const { productId = '' } = useParams()

  const { data, loading } = useGetProductForDetailsOverviewQuery({
    variables: { id: productId },
    skip: !productId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
  const product = data?.product

  if (!product && loading) {
    return <DetailsPage.Skeleton />
  }

  const attachedProductCategory = product?.productCategory ? (
    <Link
      to={generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
        productCategoryId: product.productCategory.id,
        tab: ProductCategoryDetailsTabsOptionsEnum.overview,
      })}
    >
      {product.productCategory.name}
    </Link>
  ) : (
    <Typography variant="body" color="grey600">
      {translate('text_1784590896872hcbug1hthjl')}
    </Typography>
  )

  const productType = product?.productType ? (
    <Typography variant="body" color="grey700">
      {translate(ITEM_TYPE_TRANSLATION_KEY[product.productType])}
    </Typography>
  ) : (
    '-'
  )

  const code = product?.code ? (
    <TypographyWithCopy variant="body" color="grey700">
      {product.code}
    </TypographyWithCopy>
  ) : (
    '-'
  )

  const attachedBillableMetric = product?.billableMetric ? (
    <Link
      to={generatePath(BILLABLE_METRIC_DETAILS_ROUTE, {
        billableMetricId: product.billableMetric.id,
        tab: BillableMetricDetailsTabsOptionsEnum.overview,
      })}
    >
      {product.billableMetric.name}
    </Link>
  ) : (
    '-'
  )

  return (
    <section>
      {hasPermissions(['productsUpdate']) && (
        <PageSectionTitle
          title={translate('text_1783980718114jzmq5e6getf')}
          subtitle={translate('text_17839807181145a6o0mukpar')}
          action={{
            title: translate('text_625fd39a15394c0117e7d792'),
            dataTest: PRODUCT_ITEM_OVERVIEW_EDIT_TEST_ID,
            onClick: () => product && openEditProductDrawer({ product }),
          }}
        />
      )}

      <div className="flex flex-col gap-4">
        <DetailsPage.InfoGridItem
          className="col-span-2"
          label={translate('text_17877372202296ejgkqky70w')}
          value={attachedProductCategory}
        />

        <DetailsPage.InfoGrid
          grid={[
            { label: translate('text_17839807181150t4xkvfjefv'), value: product?.name || '-' },
            { label: translate('text_1783980718114rdgmz1gtpm2'), value: code },
          ]}
        />

        {!!product?.description && (
          <DetailsPage.InfoGridItem
            label={translate('text_6388b923e514213fed58331c')}
            value={
              <ShowMoreText
                variant="body"
                color="grey700"
                text={product.description}
                limit={MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT}
              />
            }
          />
        )}

        <DetailsPage.InfoGrid
          grid={[
            { label: translate('text_1783980718113na6t9imp2k0'), value: productType },
            product?.productType === ProductTypeEnum.Usage && {
              label: translate('text_178398071811327xropcsqmr'),
              value: attachedBillableMetric,
            },
          ]}
        />

        {!!product?.invoiceDisplayName && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_65018c8e5c6b626f030bcf26')}
            value={product?.invoiceDisplayName}
          />
        )}
      </div>
    </section>
  )
}
