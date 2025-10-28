import { gql } from '@apollo/client'
import { RefObject } from 'react'

import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  IntegrationTypeEnum,
  MappingTypeEnum,
  NetsuiteIntegrationItemsListDefaultFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  type IntegrationItem,
  IntegrationItemsTable,
} from '~/pages/settings/integrations/IntegrationItem'
import ErrorImage from '~/public/images/maneki/error.svg'

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

  const defaultListToDisplay: Array<IntegrationItem> = [
    {
      id: 'fallback-item',
      icon: 'box',
      label: translate('text_6630e3210c13c500cd398e98'),
      description: translate('text_6630e3210c13c500cd398e99'),
      mappingType: MappingTypeEnum.FallbackItem,
    },
    {
      id: 'coupon',
      icon: 'box',
      label: translate('text_637ccf8133d2c9a7d11ce705'),
      description: translate('text_6630e3210c13c500cd398e9e'),
      mappingType: MappingTypeEnum.Coupon,
    },
    {
      id: 'credit-note',
      icon: 'box',
      label: translate('text_66461ada56a84401188e8c63'),
      description: translate('text_66461ada56a84401188e8c64'),
      mappingType: MappingTypeEnum.CreditNote,
    },
    {
      id: 'subscription-fee',
      icon: 'board',
      label: translate('text_6630e3210c13c500cd398ea2'),
      description: translate('text_6630e3210c13c500cd398ea3'),
      mappingType: MappingTypeEnum.SubscriptionFee,
    },
    {
      id: 'minimum-commitment',
      icon: 'board',
      label: translate('text_6630e3210c13c500cd398ea5'),
      description: translate('text_6630e3210c13c500cd398ea3'),
      mappingType: MappingTypeEnum.MinimumCommitment,
    },
    {
      id: 'tax',
      icon: 'box',
      label: translate('text_645bb193927b375079d28a8f'),
      description: translate('text_6630e3210c13c500cd398eab'),
      mappingType: MappingTypeEnum.Tax,
    },
    {
      id: 'prepaid-credit',
      icon: 'coupon',
      label: translate('text_637ccf8133d2c9a7d11ce6e1'),
      description: translate('text_6630e3210c13c500cd398eb0'),
      mappingType: MappingTypeEnum.PrepaidCredit,
    },
  ]

  return (
    <IntegrationItemsTable
      integrationId={integrationId}
      integrationMapItemDialogRef={netsuiteIntegrationMapItemDialogRef}
      defaultItems={defaultItems}
      items={defaultListToDisplay}
      provider={IntegrationTypeEnum.Netsuite}
    />
  )
}

export default NetsuiteIntegrationItemsListDefault
