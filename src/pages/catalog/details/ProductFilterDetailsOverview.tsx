import { gql } from '@apollo/client'
import { Fragment } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import {
  MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT,
  ShowMoreText,
} from '~/components/designSystem/ShowMoreText'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  LagoApiError,
  ProductCategoryForCatalogRelationsFragmentDoc,
  ProductFilterForDrawerFragmentDoc,
  ProductForCatalogRelationsFragmentDoc,
  useGetProductFilterForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { CatalogRelationsInfoGrid } from './CatalogRelationsInfoGrid'

import { useProductFilterDrawer } from '../drawers/productFilter/useProductFilterDrawer'

export const PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID =
  'product-item-filter-details-overview-edit'

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
      code
      ...ProductForCatalogRelations
      productCategory {
        id
        code
        ...ProductCategoryForCatalogRelations
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
  ${ProductCategoryForCatalogRelationsFragmentDoc}
  ${ProductForCatalogRelationsFragmentDoc}
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
      {hasPermissions(['productFiltersUpdate']) && (
        <PageSectionTitle
          title={translate('text_1784590896872mnuossjldco')}
          subtitle={translate('text_17845908968721vd9etj0npq')}
          action={{
            title: translate('text_625fd39a15394c0117e7d792'),
            dataTest: PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID,
            onClick: () => openEditProductFilterDrawer({ productFilter }),
          }}
        />
      )}

      <div className="flex flex-col gap-4">
        <CatalogRelationsInfoGrid productCategory={product.productCategory} product={product} />

        <DetailsPage.InfoGrid
          grid={[
            { label: translate('text_17883567168609zwqemkhgbu'), value: productFilter.name },
            { label: translate('text_1788356716860fkisuga4c97'), value: code },
          ]}
        />

        {!!productFilter.description && (
          <DetailsPage.InfoGridItem
            label={translate('text_6388b923e514213fed58331c')}
            value={
              <ShowMoreText
                variant="body"
                color="grey700"
                text={productFilter.description}
                limit={MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT}
              />
            }
          />
        )}

        <DetailsPage.InfoGridItem
          className="col-span-2"
          label={translate('text_1784590896872igg2htzgnso')}
          value={filterBy}
        />

        {!!productFilter.invoiceDisplayName && (
          <DetailsPage.InfoGridItem
            className="col-span-2"
            label={translate('text_65018c8e5c6b626f030bcf26')}
            value={productFilter.invoiceDisplayName}
          />
        )}
      </div>
    </section>
  )
}

export default ProductFilterDetailsOverview
