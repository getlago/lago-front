import { ALL_FILTER_VALUES } from '~/core/constants/form'
import { PrivilegeValueTypeEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

const BooleanTranslationKey = {
  true: 'text_65251f46339c650084ce0d57',
  false: 'text_65251f4cd55aeb004e5aa5ef',
}

export const transformFilterObjectToString = (key: string, value?: string): string => {
  return `{ "${[key]}": "${value || ALL_FILTER_VALUES}" }`
}

export const getEntitlementFormattedValue = (
  value: string | string[] | null | undefined,
  valueType: PrivilegeValueTypeEnum,
  translate: TranslateFunc,
) => {
  switch (true) {
    case valueType === PrivilegeValueTypeEnum.Boolean:
      return translate(BooleanTranslationKey[value as keyof typeof BooleanTranslationKey]) || ''
    case valueType === PrivilegeValueTypeEnum.Select && Array.isArray(value):
      return value?.join(', ') || ''
    default:
      return value
  }
}
