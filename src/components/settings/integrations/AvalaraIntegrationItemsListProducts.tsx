import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { ProductCatalogTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_CATALOG_TAB_ROUTE } from '~/core/router'
import {
  GetProductsForAvalaraItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetProductsForAvalaraItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { OpenMappableIntegrationMapItemDrawer } from '~/pages/settings/integrations/common'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'

gql`
  fragment AvalaraIntegrationItemsListProducts on Product {
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

type AvalaraIntegrationItemsListProductsProps = {
  data: GetProductsForAvalaraItemsListQuery | undefined
  fetchMoreProducts: ReturnType<typeof useGetProductsForAvalaraItemsListLazyQuery>[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  openIntegrationMapItemDrawer: OpenMappableIntegrationMapItemDrawer
}

const AvalaraIntegrationItemsListProducts = ({
  data,
  fetchMoreProducts,
  hasError,
  integrationId,
  isLoading,
  openIntegrationMapItemDrawer,
  searchTerm,
}: AvalaraIntegrationItemsListProductsProps) => {
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
      openIntegrationMapItemDrawer={openIntegrationMapItemDrawer}
      createRoute={productsRoute}
      mappableType={MappableTypeEnum.Product}
      provider={IntegrationTypeEnum.Avalara}
      firstColumnName={translate('text_1783980718114nwd34e3ji77')}
    />
  )
}

export default AvalaraIntegrationItemsListProducts
