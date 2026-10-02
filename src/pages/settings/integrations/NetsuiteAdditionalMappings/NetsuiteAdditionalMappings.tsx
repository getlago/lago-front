import { useMemo } from 'react'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import {
  IntegrationTypeEnum,
  MappingTypeEnum,
  useGetNetsuiteIntegrationCollectionCurrenciesMappingsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  IntegrationItem,
  IntegrationItemsTable,
} from '~/pages/settings/integrations/IntegrationItem'
import ErrorImage from '~/public/images/maneki/error.svg'

import { NetsuiteAdditionalMappingsProps } from './types'
import { useNetsuiteAdditionalMappingDrawer } from './useNetsuiteAdditionalMappingDrawer'

const NetsuiteAdditionalMappings = ({ integrationId }: NetsuiteAdditionalMappingsProps) => {
  const { translate } = useInternationalization()
  const {
    data,
    loading: isLoading,
    error: error,
  } = useGetNetsuiteIntegrationCollectionCurrenciesMappingsQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      integrationId,
    },
    fetchPolicy: 'no-cache',
  })

  const { openDrawer } = useNetsuiteAdditionalMappingDrawer()

  const integrationMappings = useMemo(() => {
    return (
      data?.integrationCollectionMappings?.collection.filter(
        (mapping) => mapping.mappingType === MappingTypeEnum.Currencies,
      ) || []
    )
  }, [data])

  const defaultListToDisplay: Array<IntegrationItem> = [
    {
      id: 'currencies',
      icon: 'coin-dollar',
      label: translate('text_1762439590827he1a1nohrjo'),
      description: translate('text_1762439590827dkj9145egub'),
      mappingType: MappingTypeEnum.Currencies,
      integrationMappings,
    },
  ]

  if (!isLoading && !!error) {
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
    <IntegrationItemsTable
      integrationId={integrationId}
      openCurrenciesMappingDrawer={openDrawer}
      items={defaultListToDisplay}
      provider={IntegrationTypeEnum.Netsuite}
      isLoading={isLoading}
      displayBillingEntities={false}
    />
  )
}

export default NetsuiteAdditionalMappings
