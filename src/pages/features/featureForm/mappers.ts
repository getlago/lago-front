import {
  FeatureForFeatureFormFragment,
  PrivilegeValueTypeEnum,
  UpdatePrivilegeInput,
} from '~/generated/graphql'

import { emptyFeatureDefaultValues, FeatureFormValues } from './validationSchema'

export const mapFeatureToFormValues = (
  feature: FeatureForFeatureFormFragment | undefined | null,
): FeatureFormValues => {
  if (!feature) return emptyFeatureDefaultValues

  return {
    name: feature.name || '',
    code: feature.code || '',
    description: feature.description || '',
    privileges: feature.privileges.map((privilege) => ({
      id: privilege.id,
      name: privilege.name || '',
      code: privilege.code,
      valueType: privilege.valueType,
      config: privilege.config?.selectOptions
        ? { selectOptions: privilege.config.selectOptions }
        : undefined,
    })),
  }
}

export const mapPrivilegesToApiInput = (
  privileges: FeatureFormValues['privileges'],
): Array<UpdatePrivilegeInput> =>
  privileges.map(({ name, code, valueType, config }) => ({
    name,
    code,
    valueType,
    config: valueType === PrivilegeValueTypeEnum.Select ? config : undefined,
  }))
