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

const BLOCKING_REASON_TRANSLATION_KEYS: Record<MoveToLiveBlockingReasonEnum, string> = {
  [MoveToLiveBlockingReasonEnum.ValueAlreadyExist]: 'text_1795431906433xcd1rme3cdx',
  [MoveToLiveBlockingReasonEnum.MoveToLiveCodeConflict]: 'text_17955393256589pupqccgr1x',
  [MoveToLiveBlockingReasonEnum.MoveToLiveParentMissing]: 'text_1795431906433wbhymkx79qb',
  [MoveToLiveBlockingReasonEnum.MoveToLiveAdminOnly]: 'text_1795431906433pfg3dttjin2',
  [MoveToLiveBlockingReasonEnum.OrganizationInactive]: 'text_1795431906433mautyr4e7ta',
  [MoveToLiveBlockingReasonEnum.MoveToLiveItemInactive]: 'text_1795431906433ulcrysmgdpl',
  [MoveToLiveBlockingReasonEnum.MoveToLiveTargetDeleted]: 'text_1795431906433ctng1qj5wb8',
  [MoveToLiveBlockingReasonEnum.MoveToLiveFilterMissing]: 'text_17954319064332x9rxogcy3c',
  [MoveToLiveBlockingReasonEnum.MoveToLiveMetricMismatch]: 'text_1795519357323iuwdw2rfp07',
  [MoveToLiveBlockingReasonEnum.MoveToLiveRateMismatch]: 'text_1795597376102tkbcu8a4f52',
  [MoveToLiveBlockingReasonEnum.MoveToLiveItemUnsupported]: 'text_1795431906433m4kipo8c27k',
  [MoveToLiveBlockingReasonEnum.MoveToLiveUnsupportedTarget]: 'text_1795431906433m4kipo8c27k',
}

// Reasons the API answers for catalog plans, which this build's schema does not type yet.
const UNTYPED_BLOCKING_REASON_TRANSLATION_KEYS: Record<string, string> = {
  currency_does_not_match: 'text_17955199987175qsul4nkfxe',
}

const UNKNOWN_ITEM_TYPE_TRANSLATION_KEY = 'text_17954414475352pip2ykpd9z'
const UNKNOWN_BLOCKING_REASON_TRANSLATION_KEY = 'text_1795441447536k9lkdhz1ect'

// The API can answer item types and blocking reasons added after this build was deployed.
const getItemTypeKey = (itemType: MoveToLiveItemTypeEnum): string => {
  const key: string | undefined = ITEM_TYPE_TRANSLATION_KEYS[itemType]

  return key ?? UNKNOWN_ITEM_TYPE_TRANSLATION_KEY
}

const getBlockingReasonKey = (reason: MoveToLiveBlockingReasonEnum): string => {
  const key: string | undefined =
    BLOCKING_REASON_TRANSLATION_KEYS[reason] ?? UNTYPED_BLOCKING_REASON_TRANSLATION_KEYS[reason]

  return key ?? UNKNOWN_BLOCKING_REASON_TRANSLATION_KEY
}

// The item was deleted from the sandbox after the list that offered it was loaded.
const isNotFound = (errors?: readonly GraphQLFormattedError[]): boolean =>
  !!errors?.some((error) => error.extensions?.code === 'not_found')

type MoveToLivePreview = MoveToLivePreviewQuery['moveToLivePreview']

type MoveToLiveTarget = {
  itemType: MoveToLiveMovableItemTypeEnum
  id: string
}

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

      if (isNotFound(error?.graphQLErrors)) return 'not_found'
      if (error || !data) return null

      return data.moveToLivePreview
    } catch {
      return null
    }
  }

  const showBlockingReason = (preview: MoveToLivePreview, target: MoveToLiveTarget): boolean => {
    if (!preview.blockingReason) return false

    const movedItem = preview.copiedItems.find((item) => item.id === target.id)

    addToast({
      severity: 'info',
      message: translateItem(
        getBlockingReasonKey(preview.blockingReason),
        preview.refusedItem ?? preview.missingParent ?? movedItem,
      ),
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

  const runMove = async (target: MoveToLiveTarget): Promise<void> => {
    const { data, errors } = await moveToLiveMode({ variables: { input: target } })
    const movedItem = data?.moveToLiveMode

    if (isNotFound(errors)) return showNotFound()

    if (movedItem && !errors?.length) {
      addToast({
        severity: 'success',
        message: translateItem('text_1795431906433hn8hins2pus', movedItem),
      })

      return
    }

    // The preview passed, so production changed meanwhile: its blocking reason names the item.
    const preview = await fetchPreview(target)

    if (preview === 'not_found') return showNotFound()
    if (!preview || !showBlockingReason(preview, target)) showError()
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
      onAction: () => withPendingGuard(() => runMove(target)),
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
