import { GenericPlaceholder } from 'lago-design-system'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { InfiniteScroll } from '~/components/designSystem'
import { createRangeArray } from '~/core/utils/createRangeArray'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { FetchIntegrationItemsListProps } from '~/pages/settings/integrations/FetchableIntegrationItemList/types'
import { IntegrationItemLine } from '~/pages/settings/integrations/IntegrationItem'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'

const FetchableIntegrationItemList = ({
  integrationId,
  data,
  fetchMore,
  hasError,
  searchTerm,
  isLoading,
  integrationMapItemDialogRef,
  createRoute,
  mappableType,
  provider,
}: FetchIntegrationItemsListProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const itemsToDisplay = useMemo(() => {
    return data?.collection || []
  }, [data?.collection])

  const metadata = useMemo(() => {
    return data?.metadata
  }, [data?.metadata])

  const displayCorrectState = () => {
    if (isLoading) {
      return createRangeArray(3).map((i) => (
        <IntegrationItemLine
          key={`fetchable-integration-item-skeleton-${i}`}
          icon="pulse"
          label={''}
          description={''}
          loading={true}
        />
      ))
    }

    if (!isLoading && !!hasError) {
      return !!searchTerm ? (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb6e')}
          subtitle={translate('text_63bab307a61c62af497e0599')}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
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

    if (!isLoading && (!itemsToDisplay || !itemsToDisplay.length)) {
      return !!searchTerm ? (
        <GenericPlaceholder
          title={translate('text_63bab307a61c62af497e05a2')}
          subtitle={translate('text_63bee4e10e2d53912bfe4da7')}
          image={<EmptyImage width="136" height="104" />}
        />
      ) : (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb70')}
          subtitle={translate('text_623b53fea66c76017eaebb78')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7c')}
          buttonVariant="primary"
          buttonAction={() => navigate(createRoute)}
          image={<EmptyImage width="136" height="104" />}
        />
      )
    }

    const handleOnBottom = () => {
      if (!metadata || !('currentPage' in metadata) || !('totalPages' in metadata)) return
      const { currentPage = 0, totalPages = 0 } = metadata

      if (currentPage < totalPages && !isLoading) {
        fetchMore({
          variables: { page: currentPage + 1 },
        })
      }
    }

    const isItemMapping = (
      item: unknown,
    ): item is NonNullable<(typeof itemsToDisplay)[0]['integrationMappings']>[0] => {
      return (
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'externalName' in item &&
        typeof item.externalName === 'string' &&
        ('externalId' in item || 'externalAccountCode' in item)
      )
    }

    const getMappingInfos = (itemMapping: unknown) => {
      if (!isItemMapping(itemMapping) || !itemMapping.id) {
        return undefined
      }

      if (provider === 'xero') {
        return {
          id: itemMapping.externalAccountCode ?? undefined,
          name: itemMapping.externalName ?? '',
        }
      }

      return {
        id: itemMapping.externalId ?? undefined,
        name: itemMapping.externalName ?? '',
      }
    }

    const getOnMappingClick = (itemMapping: unknown, itemToDisplay: (typeof itemsToDisplay)[0]) => {
      if (!isItemMapping(itemMapping) || !itemMapping.id) {
        return
      }

      integrationMapItemDialogRef.current?.openDialog({
        integrationId,
        type: mappableType,
        itemId: itemMapping?.id,
        itemExternalId: itemMapping?.externalId,
        itemExternalCode: itemMapping?.externalAccountCode || undefined,
        itemExternalName: itemMapping?.externalName || undefined,
        lagoMappableId: itemToDisplay.id,
        lagoMappableName: itemToDisplay.name,
      })
    }

    return (
      <InfiniteScroll onBottom={handleOnBottom}>
        {!!itemsToDisplay.length &&
          itemsToDisplay.map((itemToDisplay) => {
            const itemMapping = itemToDisplay.integrationMappings?.find(
              (mapping) => mapping.mappableType === mappableType,
            )

            return (
              <IntegrationItemLine
                key={`billableMetric-item-${itemToDisplay.id}`}
                icon="pulse"
                label={itemToDisplay.name}
                description={itemToDisplay.code}
                loading={false}
                onMappingClick={() => getOnMappingClick(itemMapping, itemToDisplay)}
                mappingInfos={getMappingInfos(itemMapping)}
              />
            )
          })}
      </InfiniteScroll>
    )
  }

  return <>{displayCorrectState()}</>
}

export default FetchableIntegrationItemList
