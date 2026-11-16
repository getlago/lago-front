import {
  CreateUpdateDeleteFunctions,
  CreateUpdateDeleteSuccessAnswer,
  DEFAULT_MAPPING_KEY,
  handleIntegrationMappingCreateUpdateDelete,
  isItemMappingForKeyNotForCurrenciesMapping,
  ItemMappingPerBillingEntity,
  MappableIntegrationMapItemDrawerData,
  MappableIntegrationProvider,
} from '~/pages/settings/integrations/common'

type SubmitIntegrationMapItemMappingsArgs<Entry> = {
  values: Record<string, Entry>
  drawerData: MappableIntegrationMapItemDrawerData | undefined
  mappingFunctions: CreateUpdateDeleteFunctions
  provider: MappableIntegrationProvider
}

export const submitIntegrationMapItemMappings = async <Entry>({
  values,
  drawerData,
  mappingFunctions,
  provider,
}: SubmitIntegrationMapItemMappingsArgs<Entry>): Promise<{
  success: boolean
  itemMappings: ItemMappingPerBillingEntity
}> => {
  const itemMappingsAfterSave = { ...drawerData?.itemMappings }

  const promises = (drawerData?.billingEntities || []).map(
    async (billingEntity): Promise<CreateUpdateDeleteSuccessAnswer> => {
      if (!drawerData?.itemMappings || !drawerData.type || !drawerData.integrationId)
        return {
          success: false,
          reasons: ['Missing required data for mutation'],
        }

      const { itemMappings, type, integrationId } = drawerData
      const billingEntityKey = billingEntity.key || DEFAULT_MAPPING_KEY

      if (
        !isItemMappingForKeyNotForCurrenciesMapping(
          {
            mappingType: type,
          },
          itemMappings,
          billingEntityKey,
        )
      ) {
        return {
          success: false,
          reasons: ['Mapping type is not applicable for currencies mapping'],
        }
      }

      const answer = await handleIntegrationMappingCreateUpdateDelete(
        values[billingEntityKey],
        itemMappings[billingEntityKey],
        type,
        integrationId,
        mappingFunctions,
        billingEntity,
        provider,
      )

      if (answer.success && answer.appliedMapping) {
        itemMappingsAfterSave[billingEntityKey] = answer.appliedMapping
      }

      return answer
    },
  )

  const answers = await Promise.all(promises)

  return {
    success: answers.every((answer) => answer.success),
    itemMappings: itemMappingsAfterSave,
  }
}
