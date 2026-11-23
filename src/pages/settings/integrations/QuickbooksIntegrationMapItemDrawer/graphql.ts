import { gql } from '@apollo/client'

gql`
  fragment QuickbooksIntegrationMapItemDrawer on IntegrationItem {
    id
    externalId
    externalName
    externalAccountCode
    itemType
  }

  fragment QuickbooksIntegrationMapItemDrawerCollectionMappingItem on CollectionMapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  fragment QuickbooksIntegrationMapItemDrawerCollectionItem on Mapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  # Item fetch
  query getQuickbooksIntegrationItems(
    $integrationId: ID!
    $itemType: IntegrationItemTypeEnum
    $page: Int
    $limit: Int
    $searchTerm: String
  ) {
    integrationItems(
      integrationId: $integrationId
      itemType: $itemType
      page: $page
      limit: $limit
      searchTerm: $searchTerm
    ) {
      collection {
        ...QuickbooksIntegrationMapItemDrawer
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  mutation triggerQuickbooksIntegrationAccountsRefetch($input: FetchIntegrationAccountsInput!) {
    fetchIntegrationAccounts(input: $input) {
      collection {
        ...QuickbooksIntegrationMapItemDrawer
      }
    }
  }

  mutation triggerQuickbooksIntegrationItemsRefetch($input: FetchIntegrationItemsInput!) {
    fetchIntegrationItems(input: $input) {
      collection {
        ...QuickbooksIntegrationMapItemDrawer
      }
    }
  }

  # Mapping Creation
  mutation createQuickbooksIntegrationCollectionMapping(
    $input: CreateIntegrationCollectionMappingInput!
  ) {
    createIntegrationCollectionMapping(input: $input) {
      id
      ...QuickbooksIntegrationMapItemDrawerCollectionMappingItem
    }
  }

  mutation createQuickbooksIntegrationMapping($input: CreateIntegrationMappingInput!) {
    createIntegrationMapping(input: $input) {
      id
      ...QuickbooksIntegrationMapItemDrawerCollectionItem
    }
  }

  # Mapping edition
  mutation updateQuickbooksIntegrationCollectionMapping(
    $input: UpdateIntegrationCollectionMappingInput!
  ) {
    updateIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation updateQuickbooksIntegrationMapping($input: UpdateIntegrationMappingInput!) {
    updateIntegrationMapping(input: $input) {
      id
    }
  }

  # Mapping deletion
  mutation deleteQuickbooksIntegrationCollectionMapping(
    $input: DestroyIntegrationCollectionMappingInput!
  ) {
    destroyIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation deleteQuickbooksIntegrationMapping($input: DestroyIntegrationMappingInput!) {
    destroyIntegrationMapping(input: $input) {
      id
    }
  }
`
