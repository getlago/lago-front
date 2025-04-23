import { gql } from '@apollo/client'
import { RefObject, useMemo } from 'react'

import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { AvalaraIntegrationItemsListDefaultFragment, MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import { AvalaraIntegrationMapItemDialogRef } from './AvalaraIntegrationMapItemDialog'
import IntegrationItemHeader from './IntegrationItemHeader'
import IntegrationItemLine from './IntegrationItemLine'

gql`
  fragment AvalaraIntegrationItemsListDefault on CollectionMapping {
    id
    mappingType
    externalId
    externalAccountCode
    externalName
  }
`

type AvalaraIntegrationItemsListDefaultProps = {
  defaultItems: AvalaraIntegrationItemsListDefaultFragment[] | undefined
  hasError: boolean
  integrationId: string
  isLoading: boolean
  avalaraIntegrationMapItemDialogRef: RefObject<AvalaraIntegrationMapItemDialogRef>
}

const AvalaraIntegrationItemsListDefault = ({
  defaultItems,
  hasError,
  integrationId,
  isLoading,
  avalaraIntegrationMapItemDialogRef,
}: AvalaraIntegrationItemsListDefaultProps) => {
  const { translate } = useInternationalization()

  const fallbackItem = useMemo(
    () => defaultItems?.find((item) => item.mappingType === MappingTypeEnum.FallbackItem),
    [defaultItems],
  )

  const subscriptionFee = useMemo(
    () => defaultItems?.find((item) => item.mappingType === MappingTypeEnum.SubscriptionFee),
    [defaultItems],
  )

  const minimumCommitment = useMemo(
    () => defaultItems?.find((item) => item.mappingType === MappingTypeEnum.MinimumCommitment),
    [defaultItems],
  )

  if (hasError) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <div className="flex flex-col">
      <IntegrationItemHeader columnName={translate('text_6630e3210c13c500cd398e96')} />
      <IntegrationItemLine
        icon="box"
        label={translate('text_6630e3210c13c500cd398e98')}
        description={translate('text_6630e3210c13c500cd398e99')}
        loading={isLoading}
        onMappingClick={() => {
          avalaraIntegrationMapItemDialogRef.current?.openDialog({
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
          avalaraIntegrationMapItemDialogRef.current?.openDialog({
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
          avalaraIntegrationMapItemDialogRef.current?.openDialog({
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
    </div>
  )
}

export default AvalaraIntegrationItemsListDefault
