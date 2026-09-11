import { gql } from '@apollo/client'
import { ReactNode } from 'react'
import { generatePath } from 'react-router'

import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  ProductCategoryDetailsTabsOptionsEnum,
  ProductDetailsTabsOptionsEnum,
  ProductFilterDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import {
  Link,
  PRODUCT_CATEGORY_DETAILS_ROUTE,
  PRODUCT_DETAILS_ROUTE,
  PRODUCT_FILTER_DETAILS_ROUTE,
} from '~/core/router'
import {
  ProductCategoryForCatalogRelationsFragment,
  ProductFilterForCatalogRelationsFragment,
  ProductForCatalogRelationsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ProductCategoryForCatalogRelations on ProductCategory {
    id
    name
    invoiceDisplayName
  }

  fragment ProductForCatalogRelations on Product {
    id
    name
    invoiceDisplayName
  }

  fragment ProductFilterForCatalogRelations on ProductFilter {
    id
    name
    invoiceDisplayName
  }
`

export const CATALOG_RELATIONS_NO_PRODUCT_CATEGORY_TEST_ID = 'catalog-relations-no-product-category'

type CatalogRelation = { name: string; invoiceDisplayName?: string | null }

type CatalogRelationsInfoGridProps = {
  productCategory: ProductCategoryForCatalogRelationsFragment | null | undefined
  product?: ProductForCatalogRelationsFragment
  productFilter?: ProductFilterForCatalogRelationsFragment | null
}

const getDisplayName = (relation: CatalogRelation): string =>
  relation.invoiceDisplayName || relation.name

export const CatalogRelationsInfoGrid = ({
  productCategory,
  product,
  productFilter,
}: CatalogRelationsInfoGridProps): JSX.Element => {
  const { translate } = useInternationalization()

  const renderProductCategory = (): ReactNode => {
    if (!productCategory) {
      return (
        <Typography
          variant="body"
          color="grey600"
          data-test={CATALOG_RELATIONS_NO_PRODUCT_CATEGORY_TEST_ID}
        >
          {translate('text_1784590896872hcbug1hthjl')}
        </Typography>
      )
    }

    return (
      <Link
        to={generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
          productCategoryId: productCategory.id,
          tab: ProductCategoryDetailsTabsOptionsEnum.overview,
        })}
      >
        {getDisplayName(productCategory)}
      </Link>
    )
  }

  return (
    <>
      <DetailsPage.InfoGrid
        grid={[
          {
            label: translate('text_17877372202296ejgkqky70w'),
            value: renderProductCategory(),
          },
          !!product && {
            label: translate('text_1784925227817ekmphmxz74c'),
            value: (
              <Link
                to={generatePath(PRODUCT_DETAILS_ROUTE, {
                  productId: product.id,
                  tab: ProductDetailsTabsOptionsEnum.overview,
                })}
              >
                {getDisplayName(product)}
              </Link>
            ),
          },
        ]}
      />

      {!!productFilter && (
        <DetailsPage.InfoGrid
          grid={[
            {
              label: translate('text_17849304406579sbwz4df14p'),
              value: (
                <Link
                  to={generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
                    productFilterId: productFilter.id,
                    tab: ProductFilterDetailsTabsOptionsEnum.overview,
                  })}
                >
                  {getDisplayName(productFilter)}
                </Link>
              ),
            },
          ]}
        />
      )}
    </>
  )
}
