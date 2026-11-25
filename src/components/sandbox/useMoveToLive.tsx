import { gql, useApolloClient } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'
import { ReactNode, useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  MoveToLiveBlockingReasonEnum,
  MoveToLiveItemFragment,
  MoveToLiveItemTypeEnum,
  MoveToLiveMovableItemTypeEnum,
  MoveToLivePreviewQuery,
  useMoveToLiveModeMutation,
  useMoveToLivePreviewLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { useSandbox } from '~/hooks/useSandbox'

gql`
  fragment MoveToLiveItem on MoveToLiveItem {
    id
    itemType
    code
    name
  }

  query moveToLivePreview($itemType: MoveToLiveMovableItemTypeEnum!, $id: ID!) {
    moveToLivePreview(itemType: $itemType, id: $id) {
      blockingReason
      refusalCode
      refusalField
      copiedItems {
        ...MoveToLiveItem
      }
      reusedItems {
        ...MoveToLiveItem
      }
      missingParent {
        ...MoveToLiveItem
      }
      refusedItem {
        ...MoveToLiveItem
      }
    }
  }

  mutation moveToLiveMode($input: MoveToLiveModeInput!) {
    moveToLiveMode(input: $input) {
      ...MoveToLiveItem
    }
  }
`

export const MOVE_TO_LIVE_ACTION_TEST_ID = 'move-to-live-action'
export const MOVE_TO_LIVE_COPIED_ITEMS_TEST_ID = 'move-to-live-copied-items'
export const MOVE_TO_LIVE_REUSED_ITEMS_TEST_ID = 'move-to-live-reused-items'

const ERROR_TRANSLATION_KEY = 'text_17954319064335ads00pkxh8'
const NOT_FOUND_TRANSLATION_KEY = 'text_1795539325659cdyvy8085m1'

const ITEM_TYPE_TRANSLATION_KEYS: Record<MoveToLiveItemTypeEnum, string> = {
  [MoveToLiveItemTypeEnum.BillableMetric]: 'text_1795431906433n4atjiccd3h',
  [MoveToLiveItemTypeEnum.Coupon]: 'text_17954319064331bw3yqfc0t2',
  [MoveToLiveItemTypeEnum.Feature]: 'text_1795431906433rlgowe4019k',
  [MoveToLiveItemTypeEnum.PricingUnit]: 'text_1795431906433676fmxuhwig',
  [MoveToLiveItemTypeEnum.Product]: 'text_1795431906434ld1peo7t04a',
  [MoveToLiveItemTypeEnum.ProductCategory]: 'text_1795431906434cs56t3kl5lh',
  [MoveToLiveItemTypeEnum.RateCard]: 'text_17954319064341xdvy2c5ckl',
  [MoveToLiveItemTypeEnum.Tax]: 'text_1795431906434krghsz7ups4',
}

const ITEM_UNSUPPORTED_TRANSLATION_KEY = 'text_1795431906433m4kipo8c27k'
const CUSTOM_AGGREGATION_TRANSLATION_KEY = 'text_1795632118353nbberbjhk7i'
const UNKNOWN_ITEM_TYPE_TRANSLATION_KEY = 'text_17954414475352pip2ykpd9z'
const UNKNOWN_BLOCKING_REASON_TRANSLATION_KEY = 'text_1795441447536k9lkdhz1ect'

const BLOCKING_REASON_TRANSLATION_KEYS: Record<MoveToLiveBlockingReasonEnum, string> = {
  [MoveToLiveBlockingReasonEnum.ValueAlreadyExist]: 'text_1795431906433xcd1rme3cdx',
  [MoveToLiveBlockingReasonEnum.MoveToLiveParentMissing]: 'text_1795431906433wbhymkx79qb',
  [MoveToLiveBlockingReasonEnum.MoveToLiveAdminOnly]: 'text_1795431906433pfg3dttjin2',
  [MoveToLiveBlockingReasonEnum.OrganizationInactive]: 'text_1795431906433mautyr4e7ta',
  [MoveToLiveBlockingReasonEnum.MoveToLiveItemInactive]: 'text_1795431906433ulcrysmgdpl',
  [MoveToLiveBlockingReasonEnum.MoveToLiveTargetDeleted]: 'text_1795431906433ctng1qj5wb8',
  [MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused]: ITEM_UNSUPPORTED_TRANSLATION_KEY,
  [MoveToLiveBlockingReasonEnum.MoveToLiveUnsupportedTarget]: ITEM_UNSUPPORTED_TRANSLATION_KEY,
}

// Create-service codes, keyed by `code`, `itemType/code` or `code:field`, where a field is its path without
// list indices (`values.value`) or its last key (`rateModel`). Other codes read "can't be moved".
const REFUSAL_TRANSLATION_KEYS: Record<string, string> = {
  'value_already_exist:code': 'text_17955393256589pupqccgr1x',
  [`${MoveToLiveItemTypeEnum.BillableMetric}/feature_unavailable`]:
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

type MoveToLivePreview = MoveToLivePreviewQuery['moveToLivePreview']

type MoveToLiveTarget = {
  itemType: MoveToLiveMovableItemTypeEnum
  id: string
}

// The API can answer item types and blocking reasons added after this build was deployed.
const getItemTypeKey = (itemType: MoveToLiveItemTypeEnum): string => {
  const key: string | undefined = ITEM_TYPE_TRANSLATION_KEYS[itemType]

  return key ?? UNKNOWN_ITEM_TYPE_TRANSLATION_KEY
}

const getBlockingReasonKey = (reason: MoveToLiveBlockingReasonEnum): string => {
  const key: string | undefined = BLOCKING_REASON_TRANSLATION_KEYS[reason]

  return key ?? UNKNOWN_BLOCKING_REASON_TRANSLATION_KEY
}

type Refusal = {
  code: string
  field?: string | null
}

// Fields are request paths, such as `rates[0].rateModel`.
const getFieldPath = (field: string): string => field.replace(/\[\d+\]/g, '')

const getLastFieldKey = (field: string): string => getFieldPath(field).split('.').pop() ?? field

const getRefusalKey = (
  { code, field }: Refusal,
  itemType: MoveToLiveItemTypeEnum,
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

// The move answers the create service's own error: a validation, a resource not found, or a forbidden code.
const getRefusalFromErrors = (errors?: readonly GraphQLFormattedError[]): Refusal | null => {
  const extensions = errors?.[0]?.extensions
  const code = extensions?.code

  if (typeof code !== 'string') return null

  const [field, codes] = Object.entries((extensions?.details as object | undefined) ?? {})[0] ?? []

  if (code === 'unprocessable_entity') {
    const validationCode = getFirstCode(codes)

    return validationCode ? { code: validationCode, field } : null
  }

  return { code, field: code === 'not_found' ? field : null }
}

// The moved item was deleted from the sandbox after the list that offered it was loaded. A resource
// a create service did not find in production is a refusal instead.
const isTargetNotFound = (
  target: MoveToLiveTarget,
  errors?: readonly GraphQLFormattedError[],
): boolean =>
  !!errors?.some((error) => {
    if (error.extensions?.code !== 'not_found') return false

    const details = error.extensions.details as object | undefined

    return !details || toCamelCase(target.itemType) in details
  })

type UseMoveToLive = () => {
  canMoveToLive: boolean
  moveToLive: (target: MoveToLiveTarget) => Promise<void>
}

export const useMoveToLive: UseMoveToLive = () => {
  const { translate } = useInternationalization()
  const { isSandbox } = useSandbox()
  const { hasPermissions } = usePermissions()
  const centralizedDialog = useCentralizedDialog()
  const client = useApolloClient()
  const isPendingRef = useRef(false)

  const [getPreview] = useMoveToLivePreviewLazyQuery({
    fetchPolicy: 'network-only',
    context: { silentError: true },
  })
  const [moveToLiveMode] = useMoveToLiveModeMutation({ context: { silentError: true } })

  const translateItem = (key: string, item?: MoveToLiveItemFragment | null): string =>
    translate(key, {
      itemType: item ? translate(getItemTypeKey(item.itemType)) : '',
      code: item?.code ?? '',
    })

  const translateRefusal = (refusal: Refusal, item: MoveToLiveItemFragment): string =>
    translateItem(
      getRefusalKey(refusal, item.itemType) ??
        BLOCKING_REASON_TRANSLATION_KEYS[refusal.code as MoveToLiveBlockingReasonEnum] ??
        ITEM_UNSUPPORTED_TRANSLATION_KEY,
      item,
    )

  // A live moved item is neither copied nor named by the preview, so the item an earlier preview named
  // stands in for it, or else its type.
  const getMovedItem = (
    preview: MoveToLivePreview | null,
    target: MoveToLiveTarget,
    previewedItem?: MoveToLiveItemFragment,
  ): MoveToLiveItemFragment =>
    preview?.copiedItems.find((item) => item.id === target.id) ??
    previewedItem ?? {
      id: target.id,
      itemType: target.itemType as string as MoveToLiveItemTypeEnum,
      code: null,
      name: null,
    }

  const showError = (): void => {
    addToast({ severity: 'danger', translateKey: ERROR_TRANSLATION_KEY })
  }

  // The deleted item's list is refetched, so it stops offering the item.
  const showNotFound = (): void => {
    addToast({ severity: 'info', translateKey: NOT_FOUND_TRANSLATION_KEY })
    void client.refetchQueries({ include: 'active' })
  }

  const fetchPreview = async (
    target: MoveToLiveTarget,
  ): Promise<MoveToLivePreview | 'not_found' | null> => {
    try {
      const { data, error } = await getPreview({ variables: target })

      if (isTargetNotFound(target, error?.graphQLErrors)) return 'not_found'
      if (error || !data) return null

      return data.moveToLivePreview
    } catch {
      return null
    }
  }

  const showBlockingReason = (
    preview: MoveToLivePreview,
    target: MoveToLiveTarget,
    previewedItem?: MoveToLiveItemFragment,
  ): boolean => {
    if (!preview.blockingReason) return false

    const item =
      preview.refusedItem ?? preview.missingParent ?? getMovedItem(preview, target, previewedItem)
    const refusalMessage =
      preview.blockingReason === MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused &&
      preview.refusalCode
        ? translateRefusal({ code: preview.refusalCode, field: preview.refusalField }, item)
        : null

    addToast({
      severity: 'info',
      message: refusalMessage ?? translateItem(getBlockingReasonKey(preview.blockingReason), item),
    })

    return true
  }

  const renderItems = (
    titleKey: string,
    items: MoveToLiveItemFragment[],
    dataTest: string,
  ): ReactNode => {
    if (!items.length) return null

    return (
      <div className="flex flex-col gap-2" data-test={dataTest}>
        <Typography variant="captionHl" color="grey700">
          {translate(titleKey)}
        </Typography>
        {items.map((item) => (
          <div key={`${item.itemType}-${item.id}`} className="flex flex-col">
            <Typography variant="body" color="grey700">
              {item.name || item.code}
            </Typography>
            <Typography variant="caption" color="grey600">
              {`${translate(getItemTypeKey(item.itemType))} · ${item.code ?? ''}`}
            </Typography>
          </div>
        ))}
      </div>
    )
  }

  const runMove = async (
    target: MoveToLiveTarget,
    previewedItem: MoveToLiveItemFragment,
  ): Promise<void> => {
    const { data, errors } = await moveToLiveMode({ variables: { input: target } })
    const movedItem = data?.moveToLiveMode

    if (isTargetNotFound(target, errors)) return showNotFound()

    if (movedItem && !errors?.length) {
      addToast({
        severity: 'success',
        message: translateItem('text_1795431906433hn8hins2pus', movedItem),
      })

      return
    }

    // The preview passed, so production changed meanwhile: its blocking reason names the refused item.
    const preview = await fetchPreview(target)

    if (preview === 'not_found') return showNotFound()
    if (preview && showBlockingReason(preview, target, previewedItem)) return

    const refusal = getRefusalFromErrors(errors)

    if (!refusal) return showError()

    addToast({ severity: 'info', message: translateRefusal(refusal, previewedItem) })
  }

  const previewAndConfirm = async (target: MoveToLiveTarget): Promise<void> => {
    const preview = await fetchPreview(target)

    if (preview === 'not_found') return showNotFound()
    if (!preview) return showError()
    if (showBlockingReason(preview, target)) return

    const movedItem = preview.copiedItems.find((item) => item.id === target.id)
    const copiedAlong = preview.copiedItems.filter((item) => item.id !== target.id)
    const hasItems = !!copiedAlong.length || !!preview.reusedItems.length

    void centralizedDialog.open({
      // Codes have no spaces: a long one breaks anywhere instead of overflowing the dialog.
      title: (
        <span className="[overflow-wrap:anywhere]">
          {translate('text_1795431906433rcppnbh5k88', { code: movedItem?.code ?? '' })}
        </span>
      ),
      description: translate('text_1795431906433hmboas9jg4e'),
      headerContent: hasItems ? (
        <div className="flex flex-col gap-6">
          {renderItems(
            'text_1795431906433ucgv8ljertm',
            copiedAlong,
            MOVE_TO_LIVE_COPIED_ITEMS_TEST_ID,
          )}
          {renderItems(
            'text_1795431906433d3l59aqqdzc',
            preview.reusedItems,
            MOVE_TO_LIVE_REUSED_ITEMS_TEST_ID,
          )}
        </div>
      ) : undefined,
      actionText: translate('text_1795431906432py065218gdv'),
      colorVariant: 'danger',
      cancelOrCloseText: 'cancel',
      closeOnError: false,
      onError: showError,
      onAction: () => withPendingGuard(() => runMove(target, getMovedItem(preview, target))),
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

  const moveToLive = (target: MoveToLiveTarget): Promise<void> =>
    withPendingGuard(() => previewAndConfirm(target))

  return {
    canMoveToLive: isSandbox && hasPermissions(['moveToLiveCreate']),
    moveToLive,
  }
}
