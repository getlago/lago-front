import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { RefObject, useMemo } from 'react'

import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { MappingTypeEnum, NetsuiteIntegrationItemsListDefaultFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import { AnrokIntegrationMapItemDialogRef } from './AnrokIntegrationMapItemDialog'
import IntegrationItemHeader from './IntegrationItemHeader'
import IntegrationItemLine from './IntegrationItemLine'

gql`
  fragment AnrokIntegrationItemsListDefault on CollectionMapping {
    id
    mappingType
    externalId
    externalAccountCode
    externalName
  }
`

type NetsuiteIntegrationItemsListDefaultProps = {
  defaultItems: NetsuiteIntegrationItemsListDefaultFragment[] | undefined
  hasError: boolean
  integrationId: string
  isLoading: boolean
  anrokIntegrationMapItemDialogRef: RefObject<AnrokIntegrationMapItemDialogRef>
}

const NetsuiteIntegrationItemsListDefault = ({
  defaultItems,
  hasError,
  integrationId,
  isLoading,
  anrokIntegrationMapItemDialogRef,
}: NetsuiteIntegrationItemsListDefaultProps) => {
  const { translate } = useInternationalization()

  const { fallbackItem, minimumCommitment, subscriptionFee } = useMemo(() => {
    return {
      fallbackItem: defaultItems?.find(
        (mapping) => mapping.mappingType === MappingTypeEnum.FallbackItem,
      ),
      subscriptionFee: defaultItems?.find(
        (mapping) => mapping.mappingType === MappingTypeEnum.SubscriptionFee,
      ),
      minimumCommitment: defaultItems?.find(
        (mapping) => mapping.mappingType === MappingTypeEnum.MinimumCommitment,
      ),
    }
  }, [defaultItems])

  if (!isLoading && hasError) {
    return (
      <GenericPlaceholder
        title={translate('text_624451f920b6a500aab3761a')}
        subtitle={translate('text_624451f920b6a500aab3761e')}
        buttonTitle={translate('text_624451f920b6a500aab37622')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <Stack>
      <IntegrationItemHeader columnName={translate('text_6630e3210c13c500cd398e96')} />
      <IntegrationItemLine
        icon="box"
        label={translate('text_6630e3210c13c500cd398e98')}
        description={translate('text_6630e3210c13c500cd398e99')}
        loading={isLoading}
        onMappingClick={() => {
          anrokIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.FallbackItem,
            itemId: fallbackItem?.id,
            itemExternalId: fallbackItem?.externalId,
            itemExternalName: fallbackItem?.externalName || undefined,
          })
        }}
        mappingInfos={
          fallbackItem
            ? {
                id: fallbackItem.externalId || '',
                name: fallbackItem.externalName || '',
              }
            : undefined
        }
      />
      <IntegrationItemHeader columnName={translate('text_6630e3210c13c500cd398ea0')} />
      <IntegrationItemLine
        icon="board"
        label={translate('text_6630e3210c13c500cd398ea2')}
        description={translate('text_6630e3210c13c500cd398ea3')}
        loading={isLoading}
        onMappingClick={() => {
          anrokIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.SubscriptionFee,
            itemId: subscriptionFee?.id,
            itemExternalId: subscriptionFee?.externalId,
            itemExternalName: subscriptionFee?.externalName || undefined,
          })
        }}
        mappingInfos={
          subscriptionFee
            ? {
                id: subscriptionFee.externalId || '',
                name: subscriptionFee.externalName || '',
              }
            : undefined
        }
      />
      <IntegrationItemLine
        icon="board"
        label={translate('text_6630e3210c13c500cd398ea5')}
        description={translate('text_6630e3210c13c500cd398ea3')}
        loading={isLoading}
        onMappingClick={() => {
          anrokIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.MinimumCommitment,
            itemId: minimumCommitment?.id,
            itemExternalId: minimumCommitment?.externalId,
            itemExternalName: minimumCommitment?.externalName || undefined,
          })
        }}
        mappingInfos={
          minimumCommitment
            ? {
                id: minimumCommitment.externalId || '',
                name: minimumCommitment.externalName || '',
              }
            : undefined
        }
      />
    </Stack>
  )
}

export default NetsuiteIntegrationItemsListDefault
