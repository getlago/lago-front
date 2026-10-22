import { AttributedUsageFilterInput } from '~/generated/graphql'

export type AttributionHierarchyType = {
  id: string
  code: string
  name?: string | null
  children?: AttributionHierarchyType[]
}

export type AttributionLevel = {
  code: string
  name: string
  isLeaf: boolean
}

export type AttributionPathStep = {
  code: string
  value: string | null
}

type AttributionFlatType = Pick<AttributionHierarchyType, 'code' | 'name'>

type FlattenedAttributionHierarchyType = {
  type: AttributionHierarchyType
  depth: number
}

const getAttributionTypeName = (type: AttributionFlatType): string => type.name || type.code

export const buildAttributionFilters = (
  path: AttributionPathStep[],
): AttributedUsageFilterInput[] => path.map(({ code, value }) => ({ code, values: [value ?? ''] }))

export const getAttributionNodeKey = (path: AttributionPathStep[]): string => JSON.stringify(path)

export const flattenAttributionHierarchyTypes = (
  types: AttributionHierarchyType[],
  depth = 0,
): FlattenedAttributionHierarchyType[] =>
  types.flatMap((type) => [
    { type, depth },
    ...flattenAttributionHierarchyTypes(type.children ?? [], depth + 1),
  ])

export const getDeepestAttributionHierarchyType = (
  roots: AttributionHierarchyType[],
): AttributionHierarchyType | null =>
  flattenAttributionHierarchyTypes(roots).reduce<FlattenedAttributionHierarchyType | null>(
    (deepest, current) => (!deepest || current.depth > deepest.depth ? current : deepest),
    null,
  )?.type ?? null

export const getAttributionHierarchyChain = (
  types: AttributionHierarchyType[],
  code: string,
): AttributionHierarchyType[] => {
  for (const type of types) {
    if (type.code === code) return [type]

    const chain = getAttributionHierarchyChain(type.children ?? [], code)

    if (chain.length) return [type, ...chain]
  }

  return []
}

const toHierarchyLevel = (type: AttributionHierarchyType): AttributionLevel => ({
  code: type.code,
  name: getAttributionTypeName(type),
  isLeaf: !type.children?.length,
})

export const getAttributionChildLevels = ({
  roots,
  parentCode,
  listBy,
}: {
  roots: AttributionHierarchyType[]
  parentCode: string | null
  listBy: { flatType: AttributionFlatType; underCode: string } | null
}): AttributionLevel[] => {
  if (!listBy) {
    if (!parentCode) return roots.map(toHierarchyLevel)

    const parent = flattenAttributionHierarchyTypes(roots).find(
      ({ type }) => type.code === parentCode,
    )?.type

    return (parent?.children ?? []).map(toHierarchyLevel)
  }

  const chain = getAttributionHierarchyChain(roots, listBy.underCode)

  if (!chain.length) return []

  const parentIndex = parentCode ? chain.findIndex(({ code }) => code === parentCode) : -1

  if (parentCode && parentIndex === -1) return []

  const nextType = chain[parentIndex + 1]

  if (!nextType) {
    return [
      { code: listBy.flatType.code, name: getAttributionTypeName(listBy.flatType), isLeaf: true },
    ]
  }

  return [{ code: nextType.code, name: getAttributionTypeName(nextType), isLeaf: false }]
}
