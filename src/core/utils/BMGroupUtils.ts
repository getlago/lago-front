import _isEqual from 'lodash/isEqual'

export const GroupLevelEnum = {
  NoChange: 'NoChange',
  AddOrRemove: 'AddOrRemove',
  StructuralChange: 'StructuralChange',
} as const

type determineGroupDiffLevelReturnType =
  | (typeof GroupLevelEnum)[keyof typeof GroupLevelEnum]
  | undefined
type oneDimensionGroupType = {
  key: string
  values: string[]
}
type twoDimensionGroupType = {
  key: string
  values: {
    name: string
    key: string
    values: string[]
  }[]
}
type groupType = oneDimensionGroupType | twoDimensionGroupType | {}

export const isValidJSON = (string: string) => {
  try {
    JSON.parse(string)
  } catch (e) {
    return false
  }

  return true
}

const isContainingObjectValues = (object: twoDimensionGroupType): boolean => {
  if (!object) return false
  return object.values?.every((value) => typeof value === 'object')
}

const isContainingStringValues = (object: oneDimensionGroupType): boolean => {
  if (!object) return false
  return object.values?.every((value) => typeof value === 'string')
}

export const isOneDimension = (object: oneDimensionGroupType): boolean => {
  if (!object) return false

  return (
    !!object.key && !!object.values && !!object.values.length && !!isContainingStringValues(object)
  )
}

export const isTwoDimension = (object: twoDimensionGroupType): boolean => {
  if (!object) return false

  return (
    !!object.key && !!object.values && !!object.values.length && !!isContainingObjectValues(object)
  )
}

export const isGroupValid = (object: groupType) =>
  !!object && object !== '{}' && isValidJSON(JSON.stringify(object))

const areGroupsOneDimension = (
  group1: oneDimensionGroupType,
  group2: oneDimensionGroupType
): boolean => {
  return isOneDimension(group1) && isOneDimension(group2)
}

const areGroupsTwoDimension = (
  group1: twoDimensionGroupType,
  group2: twoDimensionGroupType
): boolean => {
  return isTwoDimension(group1) && isTwoDimension(group2)
}

export const determineGroupDiffLevel: (
  group1: groupType | string,
  group2: groupType | string
) => determineGroupDiffLevelReturnType = (group1 = {}, group2 = {}) => {
  // Groups can be empty, replace them with empty object
  if (!group1 || group1 === '') group1 = '{}'
  if (!group2 || group2 === '') group2 = '{}'

  // Key stringify/parse to shallow copy the value
  const parsedGroup1 =
    typeof group1 === 'string' ? JSON.parse(group1) : JSON.parse(JSON.stringify(group1))
  const parsedGroup2 =
    typeof group2 === 'string' ? JSON.parse(group2) : JSON.parse(JSON.stringify(group2))

  // Check if one of the groups are both valid
  if (!isGroupValid(parsedGroup1) || !isGroupValid(parsedGroup2)) {
    return GroupLevelEnum.StructuralChange
  }

  if (_isEqual(parsedGroup1, parsedGroup2)) {
    return GroupLevelEnum.NoChange
  }

  // Check if groups have the same dimension
  if (
    !(
      areGroupsTwoDimension(parsedGroup1, parsedGroup2) ||
      areGroupsOneDimension(parsedGroup1, parsedGroup2)
    )
  ) {
    return GroupLevelEnum.StructuralChange
  }

  // Check if group has value change (added or removed)
  if (areGroupsTwoDimension(parsedGroup1, parsedGroup2)) {
    const parsedGroup1ValuesKeys = (parsedGroup1 as twoDimensionGroupType).values
      .map((value) => value.key)
      .sort()
    const parsedGroup2ValuesKeys = (parsedGroup2 as twoDimensionGroupType).values
      .map((value) => value.key)
      .sort()
    const parsedGroup1ValuesNames = (parsedGroup1 as twoDimensionGroupType).values
      .map((value) => value.name)
      .sort()
    const parsedGroup2ValuesNames = (parsedGroup2 as twoDimensionGroupType).values
      .map((value) => value.name)
      .sort()
    const parsedGroup1ValuesValues = (parsedGroup1 as twoDimensionGroupType).values
      .map((value) => value.values.sort())
      .sort()
    const parsedGroup2ValuesValues = (parsedGroup2 as twoDimensionGroupType).values
      .map((value) => value.values.sort())
      .sort()

    if (
      parsedGroup1.key !== parsedGroup2.key ||
      JSON.stringify(parsedGroup1ValuesKeys) !== JSON.stringify(parsedGroup2ValuesKeys) ||
      JSON.stringify(parsedGroup1ValuesNames) !== JSON.stringify(parsedGroup2ValuesNames) ||
      JSON.stringify(parsedGroup1ValuesValues) !== JSON.stringify(parsedGroup2ValuesValues)
    )
      return GroupLevelEnum.AddOrRemove
  } else if (areGroupsOneDimension(parsedGroup1, parsedGroup2)) {
    const parsedGroup1Values = (parsedGroup1 as oneDimensionGroupType).values.sort()
    const parsedGroup2Values = (parsedGroup2 as oneDimensionGroupType).values.sort()

    if (
      parsedGroup1.key !== parsedGroup2.key ||
      JSON.stringify(parsedGroup1Values) !== JSON.stringify(parsedGroup2Values)
    )
      return GroupLevelEnum.AddOrRemove
  }

  return GroupLevelEnum.NoChange
}
