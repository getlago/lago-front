import { gql } from '@apollo/client'
import { RefObject } from 'react'

import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  AnrokIntegrationItemsListDefaultFragment,
  IntegrationTypeEnum,
  MappingTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  type IntegrationItem,
  IntegrationItemsTable,
} from '~/pages/settings/integrations/IntegrationItem'
import ErrorImage from '~/public/images/maneki/error.svg'

import { AnrokIntegrationMapItemDialogRef } from './AnrokIntegrationMapItemDialog'

gql`
  fragment AnrokIntegrationItemsListDefault on CollectionMapping {
    id
    mappingType
    externalId
    externalAccountCode
    externalName
  }
`

type AnrokIntegrationItemsListDefaultProps = {
  defaultItems: AnrokIntegrationItemsListDefaultFragment[] | undefined
  hasError: boolean
  integrationId: string
  isLoading: boolean
  anrokIntegrationMapItemDialogRef: RefObject<AnrokIntegrationMapItemDialogRef>
}

const AnrokIntegrationItemsListDefault = ({
  defaultItems,
  hasError,
  integrationId,
  isLoading,
  anrokIntegrationMapItemDialogRef,
}: AnrokIntegrationItemsListDefaultProps) => {
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
  ]

  return (
    <IntegrationItemsTable
      integrationId={integrationId}
      integrationMapItemDialogRef={anrokIntegrationMapItemDialogRef}
      defaultItems={defaultItems}
      items={defaultListToDisplay}
      provider={IntegrationTypeEnum.Anrok}
    />
  )
}

export default AnrokIntegrationItemsListDefault
