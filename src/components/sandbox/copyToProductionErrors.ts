import { GraphQLFormattedError } from 'graphql'
import camelCase from 'lodash/camelCase'

import { CopyToProductionItemTypeEnum, LagoApiError } from '~/generated/graphql'

export const PARENT_MISSING_CODE = 'copy_to_production_parent_missing'

const ITEM_UNSUPPORTED_TRANSLATION_KEY = 'text_1795431906433m4kipo8c27k'
const CUSTOM_AGGREGATION_TRANSLATION_KEY = 'text_1795632118353nbberbjhk7i'
const UNKNOWN_ITEM_TYPE_TRANSLATION_KEY = 'text_17954414475352pip2ykpd9z'

const ITEM_TYPE_TRANSLATION_KEYS: Record<CopyToProductionItemTypeEnum, string> = {
  [CopyToProductionItemTypeEnum.BillableMetric]: 'text_1795431906433n4atjiccd3h',
  [CopyToProductionItemTypeEnum.CatalogPlan]: 'text_179561968624506z4suovzxj',
  [CopyToProductionItemTypeEnum.Coupon]: 'text_17954319064331bw3yqfc0t2',
  [CopyToProductionItemTypeEnum.Feature]: 'text_1795431906433rlgowe4019k',
  [CopyToProductionItemTypeEnum.PlanRateCard]: 'text_1795619686245tlzbtzvn6vz',
  [CopyToProductionItemTypeEnum.Product]: 'text_1795431906434ld1peo7t04a',
  [CopyToProductionItemTypeEnum.ProductCategory]: 'text_1795431906434cs56t3kl5lh',
}

// Error codes of the copy, keyed by `code`, `itemType/code` or `code:field`, where a field is its path
// without list indices (`values.value`) or its last key (`rateModel`). Other codes read "can't be copied".
const REFUSAL_TRANSLATION_KEYS: Record<string, string> = {
  [`${LagoApiError.ValueAlreadyExist}:code`]: 'text_1795431906433xcd1rme3cdx',
  [PARENT_MISSING_CODE]: 'text_1795431906433wbhymkx79qb',
  copy_to_production_admin_only: 'text_1795431906433pfg3dttjin2',
  [LagoApiError.OrganizationInactive]: 'text_1795431906433mautyr4e7ta',
  copy_to_production_item_inactive: 'text_1795431906433ulcrysmgdpl',
  copy_to_production_target_deleted: 'text_1795431906433ctng1qj5wb8',
  copy_to_production_privilege_mismatch: 'text_1795632678714bebtdd5na4n',
  [`${CopyToProductionItemTypeEnum.BillableMetric}/${LagoApiError.FeatureUnavailable}`]:
    CUSTOM_AGGREGATION_TRANSLATION_KEY,
  'value_is_mandatory:customAggregator': CUSTOM_AGGREGATION_TRANSLATION_KEY,
  [LagoApiError.FeatureUnavailable]: 'text_1795619366911o3vnwd5udy6',
  currency_does_not_match: 'text_17955199987175qsul4nkfxe',
  'requires_recurring_metric:proration': 'text_1795519357323iuwdw2rfp07',
  'not_allowed_for_aggregation_type:proration': 'text_1795519357323iuwdw2rfp07',
  'not_allowed_for_product:rateModel': 'text_1795597376102tkbcu8a4f52',
  'not_allowed_for_aggregation_type:rateModel': 'text_1795597376102tkbcu8a4f52',
  'not_allowed_for_billing_timing:rateModel': 'text_1795597376102tkbcu8a4f52',
  'not_allowed_with_proration:rateModel': 'text_1795597376102tkbcu8a4f52',
  [`${LagoApiError.NotFound}:productFilter`]: 'text_1795619366911a8sk62vg94f',
  [`${LagoApiError.ValueIsInvalid}:values.value`]: 'text_1795630961583o318oscsu8g',
  [`${LagoApiError.NotFound}:privilege`]: 'text_1795619686245iakqtpjfy7d',
  plan_locked: 'text_1795619686245q43n7s1yga8',
  product_already_priced: 'text_17956196862456c39s3e4ks1',
  product_filter_already_priced: 'text_17956196862456c39s3e4ks1',
}

export type CopyToProductionTarget = {
  itemType: CopyToProductionItemTypeEnum
  id: string
  code: string
}

export type NamedItem = {
  itemType?: CopyToProductionItemTypeEnum
  code: string
}

export type Refusal = {
  code: string
  field?: string | null
  parent?: NamedItem
}

const COPYABLE_ITEM_TYPES: readonly string[] = Object.values(CopyToProductionItemTypeEnum)

// The API can answer item types added after this build was deployed.
const isCopyToProductionItemType = (value: unknown): value is CopyToProductionItemTypeEnum =>
  typeof value === 'string' && COPYABLE_ITEM_TYPES.includes(value)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export const getItemTypeKey = (itemType?: CopyToProductionItemTypeEnum): string =>
  (itemType && ITEM_TYPE_TRANSLATION_KEYS[itemType]) ?? UNKNOWN_ITEM_TYPE_TRANSLATION_KEY

// Fields are request paths, such as `rates[0].rateModel`.
const getFieldPath = (field: string): string => field.replace(/\[\d+\]/g, '')

const getLastFieldKey = (field: string): string => getFieldPath(field).split('.').pop() ?? field

export const getRefusalKey = (
  { code, field }: Refusal,
  itemType?: CopyToProductionItemTypeEnum,
): string =>
  (itemType && REFUSAL_TRANSLATION_KEYS[`${itemType}/${code}`]) ||
  (field && REFUSAL_TRANSLATION_KEYS[`${code}:${getFieldPath(field)}`]) ||
  (field && REFUSAL_TRANSLATION_KEYS[`${code}:${getLastFieldKey(field)}`]) ||
  REFUSAL_TRANSLATION_KEYS[code] ||
  ITEM_UNSUPPORTED_TRANSLATION_KEY

// Validation details nest codes in arrays and objects: `{ field: ['code'] }`, `{ field: { 0: ['code'] } }`.
const getFirstCode = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return getFirstCode(value[0])
  if (isRecord(value)) return getFirstCode(Object.values(value)[0])

  return undefined
}

// The copy answers its own refusals and the create services' errors: a validation, a resource not
// found, or a forbidden code. A missing parent comes with its type and code.
export const getRefusalFromErrors = (errors?: readonly GraphQLFormattedError[]): Refusal | null => {
  const extensions = errors?.[0]?.extensions
  const code = extensions?.code
  const rawDetails = extensions?.details
  const details = isRecord(rawDetails) ? rawDetails : {}

  if (typeof code !== 'string') return null

  if (code === PARENT_MISSING_CODE) {
    return {
      code,
      parent: {
        itemType: isCopyToProductionItemType(details.itemType) ? details.itemType : undefined,
        code: typeof details.code === 'string' ? details.code : '',
      },
    }
  }

  const [field, codes] = Object.entries(details)[0] ?? []

  if (code === LagoApiError.UnprocessableEntity) {
    const validationCode = getFirstCode(codes)

    return validationCode ? { code: validationCode, field } : null
  }

  return { code, field: code === LagoApiError.NotFound ? field : null }
}

// The copied item was deleted from the sandbox after the list that offered it was loaded. A resource
// a create service did not find in production is a refusal instead.
export const isTargetNotFound = (
  target: CopyToProductionTarget,
  errors?: readonly GraphQLFormattedError[],
): boolean =>
  !!errors?.some((error) => {
    if (error.extensions?.code !== LagoApiError.NotFound) return false

    const details = error.extensions.details

    return !isRecord(details) || camelCase(target.itemType) in details
  })
