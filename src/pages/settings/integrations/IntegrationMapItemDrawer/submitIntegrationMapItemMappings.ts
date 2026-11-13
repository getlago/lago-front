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

// `itemMappings` holds the opening mappings with what the backend accepted folded in. A
// caller that submits the opening snapshot again re-sends the mutations that applied.
export type SubmitIntegrationMapItemMappingsResult = {
  success: boolean
  itemMappings: ItemMappingPerBillingEntity
}

type BillingEntityAnswer = {
  billingEntityKey: string
  answer: CreateUpdateDeleteSuccessAnswer
}

export const submitIntegrationMapItemMappings = async <Entry>({
  values,
  drawerData,
  mappingFunctions,
  provider,
}: SubmitIntegrationMapItemMappingsArgs<Entry>): Promise<SubmitIntegrationMapItemMappingsResult> => {
  const promises = (drawerData?.billingEntities || []).map(
    async (billingEntity): Promise<BillingEntityAnswer> => {
      const billingEntityKey = billingEntity.key || DEFAULT_MAPPING_KEY

      if (!drawerData?.itemMappings || !drawerData.type || !drawerData.integrationId)
        return {
          billingEntityKey,
          answer: {
            success: false,
            reasons: ['Missing required data for mutation'],
          },
        }

      const { itemMappings, type, integrationId } = drawerData

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
          billingEntityKey,
          answer: {
            success: false,
            reasons: ['Mapping type is not applicable for currencies mapping'],
          },
        }
      }

      return {
        billingEntityKey,
        answer: await handleIntegrationMappingCreateUpdateDelete(
          values[billingEntityKey],
          itemMappings[billingEntityKey],
          type,
          integrationId,
          mappingFunctions,
          billingEntity,
          provider,
        ),
      }
    },
  )

  // allSettled, not all: a rejected mutation must not discard what the others applied.
  const settledAnswers = await Promise.allSettled(promises)

  return settledAnswers.reduce<SubmitIntegrationMapItemMappingsResult>(
    (acc, settled) => {
      if (settled.status === 'rejected') return { ...acc, success: false }

      const { billingEntityKey, answer } = settled.value

      if (!answer.success) return { ...acc, success: false }
      if (!answer.appliedMapping) return acc

      return {
        ...acc,
        itemMappings: { ...acc.itemMappings, [billingEntityKey]: answer.appliedMapping },
      }
    },
    { success: true, itemMappings: { ...(drawerData?.itemMappings || {}) } },
  )
}
