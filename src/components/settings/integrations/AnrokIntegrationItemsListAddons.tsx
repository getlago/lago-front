import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { RefObject } from 'react'

import { CREATE_ADD_ON_ROUTE } from '~/core/router'
import {
  GetAddOnsForAnrokItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetAddOnsForAnrokItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'
import { IntegrationItemHeader } from '~/pages/settings/integrations/IntegrationItem'

import { AnrokIntegrationMapItemDialogRef } from './AnrokIntegrationMapItemDialog'

gql`
  fragment AnrokIntegrationItemsListAddons on AddOn {
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

type AnrokIntegrationItemsListAddonsProps = {
  data: GetAddOnsForAnrokItemsListQuery | undefined
  fetchMoreAddons: ReturnType<typeof useGetAddOnsForAnrokItemsListLazyQuery>[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  anrokIntegrationMapItemDialogRef: RefObject<AnrokIntegrationMapItemDialogRef>
}

const AnrokIntegrationItemsListAddons = ({
  data,
  fetchMoreAddons,
  hasError,
  integrationId,
  isLoading,
  anrokIntegrationMapItemDialogRef,
  searchTerm,
}: AnrokIntegrationItemsListAddonsProps) => {
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
        integrationMapItemDialogRef={anrokIntegrationMapItemDialogRef}
        createRoute={CREATE_ADD_ON_ROUTE}
        mappableType={MappableTypeEnum.AddOn}
        provider={IntegrationTypeEnum.Anrok}
      />
    </Stack>
  )
}

export default AnrokIntegrationItemsListAddons
