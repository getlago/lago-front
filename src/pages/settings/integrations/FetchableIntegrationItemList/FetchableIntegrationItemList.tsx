import { InfiniteScroll } from '~/components/designSystem'
import { createNumberRangeArray } from '~/core/utils/createNumberRangeArray'
import { MappableTypeEnum } from '~/generated/graphql'
import { FetchIntegrationItemsListProps } from '~/pages/settings/integrations/FetchableIntegrationItemList/types'
import {
  IntegrationItem,
  IntegrationItemLine,
  IntegrationItemsTable,
} from '~/pages/settings/integrations/IntegrationItem'

import FetchableIntegrationItemEmpty from './FetchableIntegrationItemEmpty'
import FetchableIntegrationItemError from './FetchableIntegrationItemError'

const FetchableIntegrationItemList = ({
  integrationId,
  data,
  fetchMore,
  hasError,
  searchTerm,
  isLoading,
  integrationMapItemDrawerRef,
  createRoute,
  mappableType,
  provider,
  firstColumnName,
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

    const formattedItems: Array<IntegrationItem> = itemsToDisplay.map((itemToDisplay) => {
      return {
        id: itemToDisplay.id,
        label: itemToDisplay.name,
        description: itemToDisplay.code,
        mappingType: mappableType,
        integrationMappings: itemToDisplay.integrationMappings,
        icon: mappableType === MappableTypeEnum.AddOn ? 'puzzle' : 'pulse',
      }
    })

    return (
      <InfiniteScroll onBottom={handleOnBottom}>
        <IntegrationItemsTable
          integrationId={integrationId}
          integrationMapItemDrawerRef={integrationMapItemDrawerRef}
          provider={provider}
          items={formattedItems}
          firstColumnName={firstColumnName}
          isLoading={isLoading}
        />
      </InfiniteScroll>
    )
  }

  return <>{displayCorrectState()}</>
}

export default FetchableIntegrationItemList
