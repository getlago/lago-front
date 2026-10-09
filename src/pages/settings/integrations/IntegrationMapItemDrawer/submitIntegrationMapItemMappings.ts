import {
  CreateUpdateDeleteFunctions,
  CreateUpdateDeleteSuccessAnswer,
  DEFAULT_MAPPING_KEY,
  handleIntegrationMappingCreateUpdateDelete,
  isItemMappingForKeyNotForCurrenciesMapping,
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
}: SubmitIntegrationMapItemMappingsArgs<Entry>): Promise<boolean> => {
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

      return await handleIntegrationMappingCreateUpdateDelete(
        values[billingEntityKey],
        itemMappings[billingEntityKey],
        type,
        integrationId,
        mappingFunctions,
        billingEntity,
        provider,
      )
    },
  )

  const answers = await Promise.all(promises)

  return answers.every((answer) => answer.success)
}
