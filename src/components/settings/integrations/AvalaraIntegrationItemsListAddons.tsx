import { gql } from '@apollo/client'
import { RefObject } from 'react'

import { CREATE_ADD_ON_ROUTE } from '~/core/router'
import {
  GetAddOnsForAvalaraItemsListQuery,
  InputMaybe,
  MappableTypeEnum,
  useGetAddOnsForAvalaraItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'
import { IntegrationItemHeader } from '~/pages/settings/integrations/IntegrationItem'

import { AvalaraIntegrationMapItemDialogRef } from './AvalaraIntegrationMapItemDialog'

gql`
  fragment AvalaraIntegrationItemsListAddons on AddOn {
    id
    name
    code
    integrationMappings(integrationId: $integrationId) {
      id
      externalId
      externalAccountCode
      externalName
      mappableType
    }
  }
`

type AvalaraIntegrationItemsListAddonsProps = {
  data: GetAddOnsForAvalaraItemsListQuery | undefined
  fetchMoreAddons: ReturnType<typeof useGetAddOnsForAvalaraItemsListLazyQuery>[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  avalaraIntegrationMapItemDialogRef: RefObject<AvalaraIntegrationMapItemDialogRef>
}

const AvalaraIntegrationItemsListAddons = ({
  data,
  fetchMoreAddons,
  hasError,
  integrationId,
  isLoading,
  avalaraIntegrationMapItemDialogRef,
  searchTerm,
}: AvalaraIntegrationItemsListAddonsProps) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col">
      <IntegrationItemHeader columnName={translate('text_6630ea71a6c2ef00bc63006f')} />
      <FetchableIntegrationItemList
        integrationId={integrationId}
        data={data?.addOns}
        fetchMore={fetchMoreAddons}
        hasError={hasError}
        searchTerm={searchTerm}
        isLoading={isLoading}
        integrationMapItemDialogRef={avalaraIntegrationMapItemDialogRef}
        createRoute={CREATE_ADD_ON_ROUTE}
        mappableType={MappableTypeEnum.AddOn}
        provider="avalara"
      />
    </div>
  )
}

export default AvalaraIntegrationItemsListAddons
