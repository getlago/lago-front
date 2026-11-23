import { gql } from '@apollo/client'
import { ReactNode } from 'react'

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
  [MoveToLiveBlockingReasonEnum.MoveToLiveCodeConflict]: 'text_1795431906433xcd1rme3cdx',
  [MoveToLiveBlockingReasonEnum.MoveToLiveParentMissing]: 'text_1795431906433wbhymkx79qb',
  [MoveToLiveBlockingReasonEnum.MoveToLiveAdminOnly]: 'text_1795431906433pfg3dttjin2',
  [MoveToLiveBlockingReasonEnum.OrganizationInactive]: 'text_1795431906433mautyr4e7ta',
  [MoveToLiveBlockingReasonEnum.MoveToLiveItemInactive]: 'text_1795431906433ulcrysmgdpl',
  [MoveToLiveBlockingReasonEnum.MoveToLiveTargetDeleted]: 'text_1795431906433ctng1qj5wb8',
  [MoveToLiveBlockingReasonEnum.MoveToLiveFilterMissing]: 'text_17954319064332x9rxogcy3c',
  [MoveToLiveBlockingReasonEnum.MoveToLiveItemUnsupported]: 'text_1795431906433m4kipo8c27k',
  [MoveToLiveBlockingReasonEnum.MoveToLiveUnsupportedTarget]: 'text_1795431906433m4kipo8c27k',
}

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

  const [getPreview] = useMoveToLivePreviewLazyQuery({
    fetchPolicy: 'network-only',
    context: { silentError: true },
  })
  const [moveToLiveMode] = useMoveToLiveModeMutation({ context: { silentError: true } })

  const translateItem = (key: string, item?: MoveToLiveItemFragment | null): string =>
    translate(key, {
      itemType: item ? translate(ITEM_TYPE_TRANSLATION_KEYS[item.itemType]) : '',
      code: item?.code ?? '',
    })

  const showError = (): void => {
    addToast({ severity: 'danger', translateKey: ERROR_TRANSLATION_KEY })
  }

  const fetchPreview = async (target: MoveToLiveTarget): Promise<MoveToLivePreview | null> => {
    try {
      const { data, error } = await getPreview({ variables: target })

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
        BLOCKING_REASON_TRANSLATION_KEYS[preview.blockingReason],
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
              {`${translate(ITEM_TYPE_TRANSLATION_KEYS[item.itemType])} · ${item.code ?? ''}`}
            </Typography>
          </div>
        ))}
      </div>
    )
  }

  const move = async (target: MoveToLiveTarget): Promise<void> => {
    const { data, errors } = await moveToLiveMode({ variables: { input: target } })
    const movedItem = data?.moveToLiveMode

    if (movedItem && !errors?.length) {
      addToast({
        severity: 'success',
        message: translateItem('text_1795431906433hn8hins2pus', movedItem),
      })

      return
    }

    // The preview passed, so production changed meanwhile: its blocking reason names the item.
    const preview = await fetchPreview(target)

    if (!preview || !showBlockingReason(preview, target)) showError()
  }

  const moveToLive = async (target: MoveToLiveTarget): Promise<void> => {
    const preview = await fetchPreview(target)

    if (!preview) return showError()
    if (showBlockingReason(preview, target)) return

    const movedItem = preview.copiedItems.find((item) => item.id === target.id)
    const copiedAlong = preview.copiedItems.filter((item) => item.id !== target.id)
    const hasItems = !!copiedAlong.length || !!preview.reusedItems.length

    centralizedDialog.open({
      title: translate('text_1795431906433rcppnbh5k88', { code: movedItem?.code ?? '' }),
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
      onAction: () => move(target),
    })
  }

  return {
    canMoveToLive: isSandbox && hasPermissions(['moveToLiveCreate']),
    moveToLive,
  }
}
