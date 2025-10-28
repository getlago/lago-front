import { InfiniteScroll } from '~/components/designSystem'
import { createNumberRangeArray } from '~/core/utils/createNumberRangeArray'
import { MappableTypeEnum } from '~/generated/graphql'
import { getMappingInfos, ItemMapping } from '~/pages/settings/integrations/common'
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
    if (isLoading && !itemsToDisplay.length && searchTerm) {
      return createNumberRangeArray(3).map((i) => (
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

    const getOnMappingClick = (
      itemMapping: ItemMapping | undefined,
      itemToDisplay: (typeof itemsToDisplay)[0],
    ) => {
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
                icon={mappableType === MappableTypeEnum.AddOn ? 'puzzle' : 'pulse'}
                label={itemToDisplay.name}
                description={itemToDisplay.code}
                loading={false}
                onMappingClick={() => getOnMappingClick(itemMapping, itemToDisplay)}
                mappingInfos={getMappingInfos(itemMapping, provider)}
              />
            )
          })}
        {isLoading &&
          createNumberRangeArray(3).map((i) => (
            <IntegrationItemLine
              key={`fetchable-integration-item-skeleton-${i}`}
              icon="pulse"
              label={''}
              description={''}
              loading={true}
            />
          ))}
      </InfiniteScroll>
    )
  }

  return <>{displayCorrectState()}</>
}

export default FetchableIntegrationItemList
