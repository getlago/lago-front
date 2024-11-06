import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { RefObject, useMemo } from 'react'

import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { MappingTypeEnum, NetsuiteIntegrationItemsListDefaultFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import IntegrationItemHeader from './IntegrationItemHeader'
import IntegrationItemLine from './IntegrationItemLine'
import { NetsuiteIntegrationMapItemDialogRef } from './NetsuiteIntegrationMapItemDialog'

gql`
  fragment NetsuiteIntegrationItemsListDefault on CollectionMapping {
    id
    mappingType
    externalId
    externalAccountCode
    externalName
    taxCode
    taxNexus
    taxType
  }
`

type NetsuiteIntegrationItemsListDefaultProps = {
  defaultItems: NetsuiteIntegrationItemsListDefaultFragment[] | undefined
  hasError: boolean
  integrationId: string
  isLoading: boolean
  netsuiteIntegrationMapItemDialogRef: RefObject<NetsuiteIntegrationMapItemDialogRef>
}

const NetsuiteIntegrationItemsListDefault = ({
  defaultItems,
  hasError,
  integrationId,
  isLoading,
  netsuiteIntegrationMapItemDialogRef,
}: NetsuiteIntegrationItemsListDefaultProps) => {
  const { translate } = useInternationalization()

  const {
    coupon,
    creditNote,
    fallbackItem,
    minimumCommitment,
    prepaidCredit,
    subscriptionFee,
    tax,
  } = useMemo(() => {
    const findDefaultItem = (mappingType: MappingTypeEnum) =>
      defaultItems?.find(
        (mapping) =>
          mapping.mappingType === mappingType &&
          !!mapping.externalId &&
          !!mapping.externalName &&
          !!mapping.externalAccountCode,
      )

    return {
      fallbackItem: findDefaultItem(MappingTypeEnum.FallbackItem),
      coupon: findDefaultItem(MappingTypeEnum.Coupon),
      creditNote: findDefaultItem(MappingTypeEnum.CreditNote),
      minimumCommitment: findDefaultItem(MappingTypeEnum.MinimumCommitment),
      prepaidCredit: findDefaultItem(MappingTypeEnum.PrepaidCredit),
      subscriptionFee: findDefaultItem(MappingTypeEnum.SubscriptionFee),
      tax: defaultItems?.find(
        (mapping) =>
          mapping.mappingType === MappingTypeEnum.Tax &&
          !!mapping.taxCode &&
          !!mapping.taxNexus &&
          !!mapping.taxType,
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
          netsuiteIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.FallbackItem,
            itemId: fallbackItem?.id,
            itemExternalId: fallbackItem?.externalId,
            itemExternalCode: fallbackItem?.externalAccountCode || undefined,
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
      <IntegrationItemHeader columnName={translate('text_6630e3210c13c500cd398e9b')} />
      <IntegrationItemLine
        icon="box"
        label={translate('text_637ccf8133d2c9a7d11ce705')}
        description={translate('text_6630e3210c13c500cd398e9e')}
        loading={isLoading}
        onMappingClick={() => {
          netsuiteIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.Coupon,
            itemId: coupon?.id,
            itemExternalId: coupon?.externalId,
            itemExternalCode: coupon?.externalAccountCode || undefined,
            itemExternalName: coupon?.externalName || undefined,
          })
        }}
        mappingInfos={
          coupon
            ? {
                id: coupon.externalId || '',
                name: coupon.externalName || '',
              }
            : undefined
        }
      />
      <IntegrationItemHeader columnName={translate('text_66461ada56a84401188e8c61')} />
      <IntegrationItemLine
        icon="box"
        label={translate('text_66461ada56a84401188e8c63')}
        description={translate('text_66461ada56a84401188e8c64')}
        loading={isLoading}
        onMappingClick={() => {
          netsuiteIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.CreditNote,
            itemId: creditNote?.id,
            itemExternalId: creditNote?.externalId,
            itemExternalCode: creditNote?.externalAccountCode || undefined,
            itemExternalName: creditNote?.externalName || undefined,
          })
        }}
        mappingInfos={
          creditNote
            ? {
                id: creditNote.externalId || '',
                name: creditNote.externalName || '',
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
          netsuiteIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.SubscriptionFee,
            itemId: subscriptionFee?.id,
            itemExternalId: subscriptionFee?.externalId,
            itemExternalCode: subscriptionFee?.externalAccountCode || undefined,
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
          netsuiteIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.MinimumCommitment,
            itemId: minimumCommitment?.id,
            itemExternalId: minimumCommitment?.externalId,
            itemExternalCode: minimumCommitment?.externalAccountCode || undefined,
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
      <IntegrationItemHeader columnName={translate('text_6630e3210c13c500cd398ea8')} />
      <IntegrationItemLine
        icon="box"
        label={translate('text_645bb193927b375079d28a8f')}
        description={translate('text_6630e3210c13c500cd398eab')}
        loading={isLoading}
        onMappingClick={() => {
          netsuiteIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.Tax,
            itemId: tax?.id,
            taxCode: tax?.taxCode,
            taxNexus: tax?.taxNexus,
            taxType: tax?.taxType,
          })
        }}
        mappingInfos={
          tax
            ? {
                name: translate('text_17272714562192y06u5okvo4'),
              }
            : undefined
        }
      />
      <IntegrationItemHeader columnName={translate('text_6630e3210c13c500cd398ead')} />
      <IntegrationItemLine
        icon="coupon"
        label={translate('text_637ccf8133d2c9a7d11ce6e1')}
        description={translate('text_6630e3210c13c500cd398eb0')}
        loading={isLoading}
        onMappingClick={() => {
          netsuiteIntegrationMapItemDialogRef.current?.openDialog({
            integrationId,
            type: MappingTypeEnum.PrepaidCredit,
            itemId: prepaidCredit?.id,
            itemExternalId: prepaidCredit?.externalId,
            itemExternalCode: prepaidCredit?.externalAccountCode || undefined,
            itemExternalName: prepaidCredit?.externalName || undefined,
          })
        }}
        mappingInfos={
          prepaidCredit
            ? {
                id: prepaidCredit.externalId || '',
                name: prepaidCredit.externalName || '',
              }
            : undefined
        }
      />
    </Stack>
  )
}

export default NetsuiteIntegrationItemsListDefault
