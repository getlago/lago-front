import { gql } from '@apollo/client'

import { CREATE_ADD_ON_ROUTE } from '~/core/router'
import {
  GetAddOnsForQuickbooksItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetAddOnsForQuickbooksItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { OpenMappableIntegrationMapItemDrawer } from '~/pages/settings/integrations/common'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'

gql`
  fragment QuickbooksIntegrationItemsListAddons on AddOn {
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
      mappableId
    }
  }
`

type QuickbooksIntegrationItemsListAddonsProps = {
  data: GetAddOnsForQuickbooksItemsListQuery | undefined
  fetchMoreAddons: ReturnType<typeof useGetAddOnsForQuickbooksItemsListLazyQuery>[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  openIntegrationMapItemDrawer: OpenMappableIntegrationMapItemDrawer
}

const QuickbooksIntegrationItemsListAddons = ({
  data,
  fetchMoreAddons,
  hasError,
  integrationId,
  isLoading,
  openIntegrationMapItemDrawer,
  searchTerm,
}: QuickbooksIntegrationItemsListAddonsProps) => {
  const { translate } = useInternationalization()

  return (
    <FetchableIntegrationItemList
      integrationId={integrationId}
      data={data?.addOns}
      fetchMore={fetchMoreAddons}
      hasError={hasError}
      searchTerm={searchTerm}
      isLoading={isLoading}
      openIntegrationMapItemDrawer={openIntegrationMapItemDrawer}
      createRoute={CREATE_ADD_ON_ROUTE}
      mappableType={MappableTypeEnum.AddOn}
      provider={IntegrationTypeEnum.Quickbooks}
      firstColumnName={translate('text_6630ea71a6c2ef00bc63006f')}
    />
  )
}

export default QuickbooksIntegrationItemsListAddons
