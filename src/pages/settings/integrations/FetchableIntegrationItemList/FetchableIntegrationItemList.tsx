import { InfiniteScroll } from '~/components/designSystem'
import { createRangeArray } from '~/core/utils/createRangeArray'
import { FetchIntegrationItemsListProps } from '~/pages/settings/integrations/FetchableIntegrationItemList/types'
import { IntegrationItemLine } from '~/pages/settings/integrations/IntegrationItem'

import FetchableIntegrationItemEmpty from './FetchableIntegrationItemEmpty'
import FetchableIntegrationItemError from './FetchableIntegrationItemError'

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
  const itemsToDisplay = data?.collection || []

  const metadata = data?.metadata

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
      return <FetchableIntegrationItemError hasSearchTerm={!!searchTerm} />
    }

    if (!isLoading && (!itemsToDisplay || !itemsToDisplay.length)) {
      return (
        <FetchableIntegrationItemEmpty
          hasSearchTerm={!!searchTerm}
          createRoute={createRoute}
          type={mappableType}
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
