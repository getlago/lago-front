import { gql, useApolloClient } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'
import { useRef } from 'react'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  CopyToProductionCopyableItemTypeEnum,
  CopyToProductionItemTypeEnum,
  useCopyToProductionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { useSandbox } from '~/hooks/useSandbox'

gql`
  mutation copyToProduction($input: CopyToProductionInput!) {
    copyToProduction(input: $input) {
      id
      code
    }
  }
`

export const COPY_TO_PRODUCTION_ACTION_TEST_ID = 'copy-to-production-action'

const TITLE_TRANSLATION_KEY = 'text_1795431906433rcppnbh5k88'
const DESCRIPTION_TRANSLATION_KEY = 'text_1795431906433hmboas9jg4e'
const ACTION_TRANSLATION_KEY = 'text_17957683665190k45li34638'
const SUCCESS_TRANSLATION_KEY = 'text_1795431906433hn8hins2pus'
const SUCCESS_WITH_LINK_TRANSLATION_KEY = 'text_1795768366519ycewco9f1qj'
const ERROR_TRANSLATION_KEY = 'text_17954319064335ads00pkxh8'
const NOT_FOUND_TRANSLATION_KEY = 'text_1795539325659cdyvy8085m1'
const ITEM_UNSUPPORTED_TRANSLATION_KEY = 'text_1795431906433m4kipo8c27k'
const CUSTOM_AGGREGATION_TRANSLATION_KEY = 'text_1795632118353nbberbjhk7i'
const UNKNOWN_ITEM_TYPE_TRANSLATION_KEY = 'text_17954414475352pip2ykpd9z'

const PARENT_MISSING_CODE = 'copy_to_production_parent_missing'

const ITEM_TYPE_TRANSLATION_KEYS: Record<CopyToProductionItemTypeEnum, string> = {
  [CopyToProductionItemTypeEnum.BillableMetric]: 'text_1795431906433n4atjiccd3h',
  [CopyToProductionItemTypeEnum.Coupon]: 'text_17954319064331bw3yqfc0t2',
  [CopyToProductionItemTypeEnum.Feature]: 'text_1795431906433rlgowe4019k',
  [CopyToProductionItemTypeEnum.PricingUnit]: 'text_1795431906433676fmxuhwig',
  [CopyToProductionItemTypeEnum.Product]: 'text_1795431906434ld1peo7t04a',
  [CopyToProductionItemTypeEnum.ProductCategory]: 'text_1795431906434cs56t3kl5lh',
  [CopyToProductionItemTypeEnum.RateCard]: 'text_17954319064341xdvy2c5ckl',
  [CopyToProductionItemTypeEnum.Tax]: 'text_1795431906434krghsz7ups4',
}

// Error codes of the copy, keyed by `code`, `itemType/code` or `code:field`, where a field is its path
// without list indices (`values.value`) or its last key (`rateModel`). Other codes read "can't be copied".
const REFUSAL_TRANSLATION_KEYS: Record<string, string> = {
  'value_already_exist:code': 'text_1795431906433xcd1rme3cdx',
  [PARENT_MISSING_CODE]: 'text_1795431906433wbhymkx79qb',
  copy_to_production_admin_only: 'text_1795431906433pfg3dttjin2',
  organization_inactive: 'text_1795431906433mautyr4e7ta',
  copy_to_production_item_inactive: 'text_1795431906433ulcrysmgdpl',
  copy_to_production_target_deleted: 'text_1795431906433ctng1qj5wb8',
  [`${CopyToProductionItemTypeEnum.BillableMetric}/feature_unavailable`]:
    CUSTOM_AGGREGATION_TRANSLATION_KEY,
  'value_is_mandatory:customAggregator': CUSTOM_AGGREGATION_TRANSLATION_KEY,
  feature_unavailable: 'text_1795619366911o3vnwd5udy6',
  currency_does_not_match: 'text_17955199987175qsul4nkfxe',
  'requires_recurring_metric:proration': 'text_1795519357323iuwdw2rfp07',
  'not_allowed_for_aggregation_type:proration': 'text_1795519357323iuwdw2rfp07',
  'not_allowed_for_product:rateModel': 'text_1795597376102tkbcu8a4f52',
  'not_allowed_for_aggregation_type:rateModel': 'text_1795597376102tkbcu8a4f52',
  'not_allowed_for_billing_timing:rateModel': 'text_1795597376102tkbcu8a4f52',
  'not_allowed_with_proration:rateModel': 'text_1795597376102tkbcu8a4f52',
  'not_found:productFilter': 'text_1795619366911a8sk62vg94f',
  'value_is_invalid:values.value': 'text_1795630961583o318oscsu8g',
}

type CopyToProductionTarget = {
  itemType: CopyToProductionCopyableItemTypeEnum
  id: string
  code: string
}

// The item a message names: the copied one, or the parent to copy first.
type NamedItem = {
  itemType: CopyToProductionItemTypeEnum
  code: string
}

type Refusal = {
  code: string
  field?: string | null
  parent?: NamedItem
}

// The API can answer item types added after this build was deployed.
const getItemTypeKey = (itemType: CopyToProductionItemTypeEnum): string => {
  const key: string | undefined = ITEM_TYPE_TRANSLATION_KEYS[itemType]

  return key ?? UNKNOWN_ITEM_TYPE_TRANSLATION_KEY
}

// Fields are request paths, such as `rates[0].rateModel`.
const getFieldPath = (field: string): string => field.replace(/\[\d+\]/g, '')

const getLastFieldKey = (field: string): string => getFieldPath(field).split('.').pop() ?? field

const getRefusalKey = (
  { code, field }: Refusal,
  itemType: CopyToProductionItemTypeEnum,
): string | undefined =>
  REFUSAL_TRANSLATION_KEYS[`${itemType}/${code}`] ??
  (field && REFUSAL_TRANSLATION_KEYS[`${code}:${getFieldPath(field)}`]) ??
  (field && REFUSAL_TRANSLATION_KEYS[`${code}:${getLastFieldKey(field)}`]) ??
  REFUSAL_TRANSLATION_KEYS[code]

const toCamelCase = (value: string): string =>
  value.replace(/_(\w)/g, (_, letter: string) => letter.toUpperCase())

// Validation details nest codes in arrays and objects: `{ field: ['code'] }`, `{ field: { 0: ['code'] } }`.
const getFirstCode = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return getFirstCode(value[0])
  if (value && typeof value === 'object') return getFirstCode(Object.values(value)[0])

  return undefined
}

// The copy answers its own refusals and the create services' errors: a validation, a resource not
// found, or a forbidden code. A missing parent comes with its type and code.
const getRefusalFromErrors = (errors?: readonly GraphQLFormattedError[]): Refusal | null => {
  const extensions = errors?.[0]?.extensions
  const code = extensions?.code
  const details = (extensions?.details as Record<string, unknown> | undefined) ?? {}

  if (typeof code !== 'string') return null

  if (code === PARENT_MISSING_CODE) {
    return {
      code,
      parent: {
        itemType: details.itemType as CopyToProductionItemTypeEnum,
        code: typeof details.code === 'string' ? details.code : '',
      },
    }
  }

  const [field, codes] = Object.entries(details)[0] ?? []

  if (code === 'unprocessable_entity') {
    const validationCode = getFirstCode(codes)

    return validationCode ? { code: validationCode, field } : null
  }

  return { code, field: code === 'not_found' ? field : null }
}

// The copied item was deleted from the sandbox after the list that offered it was loaded. A resource
// a create service did not find in production is a refusal instead.
const isTargetNotFound = (
  target: CopyToProductionTarget,
  errors?: readonly GraphQLFormattedError[],
): boolean =>
  !!errors?.some((error) => {
    if (error.extensions?.code !== 'not_found') return false

    const details = error.extensions.details as object | undefined

    return !details || toCamelCase(target.itemType) in details
  })

type UseCopyToProduction = () => {
  canCopyToProduction: boolean
  copyToProduction: (target: CopyToProductionTarget) => void
}

export const useCopyToProduction: UseCopyToProduction = () => {
  const { translate } = useInternationalization()
  const { isSandbox, productionPath } = useSandbox()
  const { hasPermissions } = usePermissions()
  const centralizedDialog = useCentralizedDialog()
  const client = useApolloClient()
  const isPendingRef = useRef(false)

  const [copyToProductionMutation] = useCopyToProductionMutation({
    context: { silentError: true },
  })

  const translateItem = (key: string, item: NamedItem): string =>
    translate(key, { itemType: translate(getItemTypeKey(item.itemType)), code: item.code })

  const showError = (): void => {
    addToast({ severity: 'danger', translateKey: ERROR_TRANSLATION_KEY })
  }

  // The deleted item's list is refetched, so it stops offering the item.
  const showNotFound = (): void => {
    addToast({ severity: 'info', translateKey: NOT_FOUND_TRANSLATION_KEY })
    void client.refetchQueries({ include: 'active' })
  }

  // Links to production when the user can open it from this session.
  const showSuccess = (code: string): void => {
    addToast({
      severity: 'success',
      message: productionPath
        ? translate(SUCCESS_WITH_LINK_TRANSLATION_KEY, { code, href: productionPath })
        : translate(SUCCESS_TRANSLATION_KEY, { code }),
    })
  }

  const runCopy = async (target: CopyToProductionTarget): Promise<void> => {
    const { data, errors } = await copyToProductionMutation({ variables: { input: target } })

    if (isTargetNotFound(target, errors)) return showNotFound()
    if (data?.copyToProduction && !errors?.length) return showSuccess(target.code)

    const refusal = getRefusalFromErrors(errors)

    if (!refusal) return showError()

    const item = refusal.parent ?? {
      itemType: target.itemType as string as CopyToProductionItemTypeEnum,
      code: target.code,
    }

    addToast({
      severity: 'info',
      message: translateItem(
        getRefusalKey(refusal, item.itemType) ?? ITEM_UNSUPPORTED_TRANSLATION_KEY,
        item,
      ),
    })
  }

  const withPendingGuard = async (run: () => Promise<void>): Promise<void> => {
    if (isPendingRef.current) return

    isPendingRef.current = true

    try {
      await run()
    } finally {
      isPendingRef.current = false
    }
  }

  const copyToProduction = (target: CopyToProductionTarget): void => {
    void centralizedDialog.open({
      // Codes have no spaces: a long one breaks anywhere instead of overflowing the dialog.
      title: (
        <span className="[overflow-wrap:anywhere]">
          {translate(TITLE_TRANSLATION_KEY, { code: target.code })}
        </span>
      ),
      description: translate(DESCRIPTION_TRANSLATION_KEY),
      actionText: translate(ACTION_TRANSLATION_KEY),
      cancelOrCloseText: 'cancel',
      closeOnError: false,
      onError: showError,
      onAction: () => withPendingGuard(() => runCopy(target)),
    })
  }

  return {
    canCopyToProduction: isSandbox && hasPermissions(['copyToProductionCreate']),
    copyToProduction,
  }
}
