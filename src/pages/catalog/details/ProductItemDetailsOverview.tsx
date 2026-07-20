import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  BillableMetricDetailsTabsOptionsEnum,
  ProductDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { BILLABLE_METRIC_DETAILS_ROUTE, Link, PRODUCT_DETAILS_ROUTE } from '~/core/router'
import {
  LagoApiError,
  ProductItemForDrawerFragmentDoc,
  ProductItemTypeEnum,
  useGetProductItemForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductItemDrawer } from '../drawers/productItem/useProductItemDrawer'

export const PRODUCT_ITEM_OVERVIEW_EDIT_TEST_ID = 'product-item-overview-edit'

const ITEM_TYPE_TRANSLATION_KEY: Record<ProductItemTypeEnum, string> = {
  [ProductItemTypeEnum.Fixed]: 'text_1783980718113ritmy7z94je',
  [ProductItemTypeEnum.Usage]: 'text_17839807181133l3z83156s6',
}

gql`
  fragment ProductItemForDetailsOverview on ProductItem {
    id
    name
    code
    description
    invoiceDisplayName
    itemType
    product {
      id
      name
      code
    }
    billableMetric {
      id
      name
      code
    }
    ...ProductItemForDrawer
  }

  query getProductItemForDetailsOverview($id: ID!) {
    productItem(id: $id) {
      id
      ...ProductItemForDetailsOverview
    }
  }

  ${ProductItemForDrawerFragmentDoc}
`

export const ProductItemDetailsOverview = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductItemDrawer } = useProductItemDrawer()
  const { productItemId = '' } = useParams()

  const { data, loading } = useGetProductItemForDetailsOverviewQuery({
    variables: { id: productItemId },
    skip: !productItemId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
  const productItem = data?.productItem

  if (!productItem && loading) {
    return <DetailsPage.Skeleton />
  }

  return (
    <section>
      <div className="flex h-18 items-center justify-between gap-4">
        <div className="flex flex-col">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_1783980718114jzmq5e6getf')}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_17839807181145a6o0mukpar')}
          </Typography>
        </div>
        {hasPermissions(['productItemsUpdate']) && (
          <Button
            variant="inline"
            data-test={PRODUCT_ITEM_OVERVIEW_EDIT_TEST_ID}
            onClick={() => productItem && openEditProductItemDrawer({ productItem })}
          >
            {translate('text_625fd39a15394c0117e7d792')}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <DetailsPage.InfoGrid
          grid={[
            {
              label: translate('text_17839807181143h6kt2bdiyi'),
              value: productItem?.product ? (
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
                '-'
              ),
            },
            {
              label: translate('text_1783980718113na6t9imp2k0'),
              value: productItem?.itemType ? (
                <Chip
                  size="small"
                  label={translate(ITEM_TYPE_TRANSLATION_KEY[productItem.itemType])}
                />
              ) : (
                '-'
              ),
            },
            {
              label: translate('text_17839807181150t4xkvfjefv'),
              value: productItem?.name || '-',
            },
            {
              label: translate('text_1783980718114rdgmz1gtpm2'),
              value: productItem?.code ? (
                <TypographyWithCopy variant="body" color="grey700">
                  {productItem.code}
                </TypographyWithCopy>
              ) : (
                '-'
              ),
            },
            productItem?.itemType === ProductItemTypeEnum.Usage && {
              label: translate('text_178398071811327xropcsqmr'),
              value: productItem?.billableMetric ? (
                <Link
                  to={generatePath(BILLABLE_METRIC_DETAILS_ROUTE, {
                    billableMetricId: productItem.billableMetric.id,
                    tab: BillableMetricDetailsTabsOptionsEnum.overview,
                  })}
                >
                  <Typography variant="body" color="grey700">
                    {productItem.billableMetric.name}
                  </Typography>
                </Link>
              ) : (
                '-'
              ),
            },
          ]}
        />

        {!!productItem?.description && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_6388b923e514213fed58331c')}
            value={productItem?.description || '-'}
          />
        )}

        {!!productItem?.invoiceDisplayName && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_65018c8e5c6b626f030bcf26')}
            value={productItem?.invoiceDisplayName}
          />
        )}
      </div>
    </section>
  )
}
