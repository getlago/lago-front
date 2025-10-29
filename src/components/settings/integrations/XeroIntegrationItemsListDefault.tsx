import { gql } from '@apollo/client'
import { RefObject } from 'react'

import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  IntegrationTypeEnum,
  MappingTypeEnum,
  XeroIntegrationItemsListDefaultFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  IntegrationItem,
  IntegrationItemsTable,
} from '~/pages/settings/integrations/IntegrationItem'
import ErrorImage from '~/public/images/maneki/error.svg'

import { XeroIntegrationMapItemDialogRef } from './XeroIntegrationMapItemDialog'

gql`
  fragment XeroIntegrationItemsListDefault on CollectionMapping {
    id
    mappingType
    externalId
    externalAccountCode
    externalName
  }
`

type XeroIntegrationItemsListDefaultProps = {
  defaultItems: XeroIntegrationItemsListDefaultFragment[] | undefined
  hasError: boolean
  integrationId: string
  isLoading: boolean
  xeroIntegrationMapItemDialogRef: RefObject<XeroIntegrationMapItemDialogRef>
}

const XeroIntegrationItemsListDefault = ({
  defaultItems,
  hasError,
  integrationId,
  isLoading,
  xeroIntegrationMapItemDialogRef,
}: XeroIntegrationItemsListDefaultProps) => {
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

  /**
   * integrationMappings is passed to each item because FetchableIntegrationItems (billing + addOns) each have their own mappings
   * while defaultItems here is the full list of mappings for all mapping types
   */
  const defaultListToDisplay: Array<IntegrationItem> = [
    {
      id: 'fallback-item',
      icon: 'box',
      label: translate('text_6630e3210c13c500cd398e98'),
      description: translate('text_6630e3210c13c500cd398e99'),
      mappingType: MappingTypeEnum.FallbackItem,
      integrationMappings: defaultItems,
    },
    {
      id: 'coupon',
      icon: 'box',
      label: translate('text_637ccf8133d2c9a7d11ce705'),
      description: translate('text_6630e3210c13c500cd398e9e'),
      mappingType: MappingTypeEnum.Coupon,
      integrationMappings: defaultItems,
    },
    {
      id: 'credit-note',
      icon: 'box',
      label: translate('text_66461ada56a84401188e8c63'),
      description: translate('text_66461ada56a84401188e8c64'),
      mappingType: MappingTypeEnum.CreditNote,
      integrationMappings: defaultItems,
    },
    {
      id: 'subscription-fee',
      icon: 'board',
      label: translate('text_6630e3210c13c500cd398ea2'),
      description: translate('text_6630e3210c13c500cd398ea3'),
      mappingType: MappingTypeEnum.SubscriptionFee,
      integrationMappings: defaultItems,
    },
    {
      id: 'minimum-commitment',
      icon: 'board',
      label: translate('text_6630e3210c13c500cd398ea5'),
      description: translate('text_6630e3210c13c500cd398ea3'),
      mappingType: MappingTypeEnum.MinimumCommitment,
      integrationMappings: defaultItems,
    },
    {
      id: 'account',
      icon: 'box',
      label: translate('text_6672ebb8b1b50be550eccbed'),
      description: translate('text_6672ebb8b1b50be550eccbf0'),
      mappingType: MappingTypeEnum.Account,
      integrationMappings: defaultItems,
    },
    {
      id: 'prepaid-credit',
      icon: 'coupon',
      label: translate('text_637ccf8133d2c9a7d11ce6e1'),
      description: translate('text_6630e3210c13c500cd398eb0'),
      mappingType: MappingTypeEnum.PrepaidCredit,
      integrationMappings: defaultItems,
    },
  ]

  return (
    <IntegrationItemsTable
      integrationId={integrationId}
      integrationMapItemDialogRef={xeroIntegrationMapItemDialogRef}
      items={defaultListToDisplay}
      provider={IntegrationTypeEnum.Xero}
    />
  )
}

export default XeroIntegrationItemsListDefault
