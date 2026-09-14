import { gql } from '@apollo/client'
import { RefObject } from 'react'
import { generatePath } from 'react-router-dom'

import { ProductCatalogTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_CATALOG_TAB_ROUTE } from '~/core/router'
import {
  GetProductsForAnrokItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetProductsForAnrokItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { AnrokIntegrationMapItemDrawerRef } from '~/pages/settings/integrations/AnrokIntegrationMapItemDrawer'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'

gql`
  fragment AnrokIntegrationItemsListProducts on Product {
    id
    name
    code
    integrationMappings(integrationId: $integrationId) {
      id
      externalId
      externalAccountCode
      externalName
      mappableType
      billingEntityId
    }
  }
`

type AnrokIntegrationItemsListProductsProps = {
  data: GetProductsForAnrokItemsListQuery | undefined
  fetchMoreProducts: ReturnType<typeof useGetProductsForAnrokItemsListLazyQuery>[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  anrokIntegrationMapItemDrawerRef: RefObject<AnrokIntegrationMapItemDrawerRef>
}

const AnrokIntegrationItemsListProducts = ({
  data,
  fetchMoreProducts,
  hasError,
  integrationId,
  isLoading,
  anrokIntegrationMapItemDrawerRef,
  searchTerm,
}: AnrokIntegrationItemsListProductsProps) => {
  const { translate } = useInternationalization()
  const productsRoute = generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
    tab: ProductCatalogTabsOptionsEnum.products,
  })

  return (
    <FetchableIntegrationItemList
      integrationId={integrationId}
      data={data?.products}
      fetchMore={fetchMoreProducts}
      hasError={hasError}
      searchTerm={searchTerm}
      isLoading={isLoading}
      integrationMapItemDrawerRef={anrokIntegrationMapItemDrawerRef}
      createRoute={productsRoute}
      mappableType={MappableTypeEnum.Product}
      provider={IntegrationTypeEnum.Anrok}
      firstColumnName={translate('text_1783980718114nwd34e3ji77')}
    />
  )
}

export default AnrokIntegrationItemsListProducts
