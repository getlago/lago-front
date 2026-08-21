/**
 * Searchable combobox label for a NetSuite subsidiary. `externalName` is
 * nullable: without it, fall back to the id alone (never "null (id)").
 */
export const getSubsidiaryLabel = ({
  externalName,
  externalId,
}: {
  externalName?: string | null
  externalId: string
}): string => {
  if (!externalName) return externalId

  return `${externalName} (${externalId})`
}
