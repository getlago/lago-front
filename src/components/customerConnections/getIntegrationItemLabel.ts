// Combobox label for an integration item (NetSuite subsidiary, QuickBooks customer): the name
// and id, or the id alone without a name (never "null (id)").
export const getIntegrationItemLabel = ({
  externalName,
  externalId,
}: {
  externalName?: string | null
  externalId: string
}): string => {
  if (!externalName) return externalId

  return `${externalName} (${externalId})`
}
