import { AppliedRateCardRow, STANDALONE_GROUP_KEY } from './types'

export const getGroupKey = (row: AppliedRateCardRow): string =>
  row.product.productCategory?.id ?? STANDALONE_GROUP_KEY

// Reorders within the current page only: the backend has no orderBy, so a category's rows can
// arrive split, and moving rows across pages would contradict the pagination metadata.
export const groupRowsByCategory = <T extends AppliedRateCardRow>(rows: T[]): T[] => {
  const groups = new Map<string, T[]>()

  for (const row of rows) {
    const key = getGroupKey(row)
    const group = groups.get(key)

    if (group) {
      group.push(row)
    } else {
      groups.set(key, [row])
    }
  }

  const standaloneRows = groups.get(STANDALONE_GROUP_KEY) ?? []

  groups.delete(STANDALONE_GROUP_KEY)

  return [...Array.from(groups.values()).flat(), ...standaloneRows]
}
