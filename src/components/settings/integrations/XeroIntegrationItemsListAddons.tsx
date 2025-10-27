import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { RefObject } from 'react'

import { CREATE_ADD_ON_ROUTE } from '~/core/router'
import {
  GetAddOnsForXeroItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetAddOnsForXeroItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'
import { IntegrationItemHeader } from '~/pages/settings/integrations/IntegrationItem'

import { XeroIntegrationMapItemDialogRef } from './XeroIntegrationMapItemDialog'

gql`
  fragment XeroIntegrationItemsListAddons on AddOn {
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

type XeroIntegrationItemsListAddonsProps = {
  data: GetAddOnsForXeroItemsListQuery | undefined
  fetchMoreAddons: ReturnType<typeof useGetAddOnsForXeroItemsListLazyQuery>[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  xeroIntegrationMapItemDialogRef: RefObject<XeroIntegrationMapItemDialogRef>
}

const XeroIntegrationItemsListAddons = ({
  data,
  fetchMoreAddons,
  hasError,
  integrationId,
  isLoading,
  xeroIntegrationMapItemDialogRef,
  searchTerm,
}: XeroIntegrationItemsListAddonsProps) => {
  const { translate } = useInternationalization()

  return (
    <Stack>
      <IntegrationItemHeader columnName={translate('text_6630ea71a6c2ef00bc63006f')} />
      <FetchableIntegrationItemList
        integrationId={integrationId}
        data={data?.addOns}
        fetchMore={fetchMoreAddons}
        hasError={hasError}
        searchTerm={searchTerm}
        isLoading={isLoading}
        integrationMapItemDialogRef={xeroIntegrationMapItemDialogRef}
        createRoute={CREATE_ADD_ON_ROUTE}
        mappableType={MappableTypeEnum.AddOn}
        provider={IntegrationTypeEnum.Xero}
      />
    </Stack>
  )
}

export default XeroIntegrationItemsListAddons
