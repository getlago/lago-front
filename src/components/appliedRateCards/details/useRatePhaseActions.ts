import { IconName } from 'lago-design-system'

import { APPLIED_RATE_CARD_CONTEXT_CONFIG } from '~/components/appliedRateCards/appliedRateCardContextConfig'
import { useDeleteRatePhaseDialog } from '~/components/appliedRateCards/dialogs/useDeleteRatePhaseDialog'
import { useResetRatePhaseOverrideDialog } from '~/components/appliedRateCards/dialogs/useResetRatePhaseOverrideDialog'
import { RatePhaseReference } from '~/components/appliedRateCards/drawers/ratePhase/ratePhaseFormSchema'
import {
  RateCardForRatePhaseFields,
  RatePhaseDrawerProps,
} from '~/components/appliedRateCards/drawers/ratePhase/types'
import { useRatePhaseDrawer } from '~/components/appliedRateCards/drawers/ratePhase/useRatePhaseDrawer'
import { formatRatePhaseName } from '~/components/appliedRateCards/ratePhaseDisplay'
import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { RatePhaseForDrawerFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

export const RATE_PHASE_ACTION_COPY_TEST_ID = 'rate-phase-action-copy'
export const RATE_PHASE_ACTION_EDIT_TEST_ID = 'rate-phase-action-edit'
export const RATE_PHASE_ACTION_RESET_TEST_ID = 'rate-phase-action-reset'
export const RATE_PHASE_ACTION_DELETE_TEST_ID = 'rate-phase-action-delete'

export type RatePhaseActionKey = 'copy' | 'edit' | 'reset' | 'delete'

export type RatePhaseAction = {
  key: RatePhaseActionKey
  label: string
  startIcon: IconName
  disabled: boolean
  dataTest: string
  onAction: () => void
}

export type UseRatePhaseActionsParams = {
  context: AppliedRateCardContext
  appliedRateCardId: string
  rateCard: RateCardForRatePhaseFields | undefined
  phases: RatePhaseForDrawerFragment[]
  isLocked: boolean
  onPhaseDeleted?: (phase: RatePhaseForDrawerFragment) => void
}

export type RatePhaseActions = {
  getPhaseActions: (phase: RatePhaseForDrawerFragment) => RatePhaseAction[]
  createPhase: { hidden: boolean; disabled: boolean; open: () => void }
}

type AppliedRateCardDrawerKey =
  | { context: 'plan'; planAppliedRateCardId: string }
  | { context: 'contract'; contractAppliedRateCardId: string }

const toPhaseReferences = (phases: RatePhaseForDrawerFragment[]): RatePhaseReference[] =>
  phases.map(({ code, name }) => ({ code, name: name ?? '' }))

export const useRatePhaseActions = ({
  context,
  appliedRateCardId,
  rateCard,
  phases,
  isLocked,
  onPhaseDeleted,
}: UseRatePhaseActionsParams): RatePhaseActions => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer } = useRatePhaseDrawer()
  const { openDeleteRatePhaseDialog } = useDeleteRatePhaseDialog()
  const { openResetRatePhaseOverrideDialog } = useResetRatePhaseOverrideDialog()

  const canUpdate = hasPermissions([APPLIED_RATE_CARD_CONTEXT_CONFIG[context].updatePermission])
  const isMutationDisabled = isLocked || !rateCard

  const getDrawerKey = (): AppliedRateCardDrawerKey => {
    if (context === 'plan') return { context, planAppliedRateCardId: appliedRateCardId }

    return { context, contractAppliedRateCardId: appliedRateCardId }
  }

  const openCreateDrawer = (): void => {
    if (!rateCard) return

    const params: RatePhaseDrawerProps = {
      ...getDrawerKey(),
      mode: 'create',
      otherPhases: toPhaseReferences(phases),
      rateCard,
    }

    openDrawer(params)
  }

  const openEditDrawer = (phase: RatePhaseForDrawerFragment): void => {
    if (!rateCard) return

    const params: RatePhaseDrawerProps = {
      ...getDrawerKey(),
      mode: 'edit',
      phase,
      otherPhases: toPhaseReferences(phases.filter(({ id }) => id !== phase.id)),
      rateCard,
    }

    openDrawer(params)
  }

  const getDialogPhase = (phase: RatePhaseForDrawerFragment): { code: string; name: string } => ({
    code: phase.code,
    name: formatRatePhaseName(phase, translate),
  })

  const copyPhaseCode = (phase: RatePhaseForDrawerFragment): void => {
    copyToClipboard(phase.code)
    addToast({ severity: 'info', translateKey: 'text_1775559630554ourrtpgddty' })
  }

  const getPhaseActions = (phase: RatePhaseForDrawerFragment): RatePhaseAction[] => {
    const copyAction: RatePhaseAction = {
      key: 'copy',
      label: translate('text_1792505051512l94aiaeyyqm'),
      startIcon: 'duplicate',
      disabled: false,
      dataTest: RATE_PHASE_ACTION_COPY_TEST_ID,
      onAction: () => copyPhaseCode(phase),
    }

    if (!canUpdate) return [copyAction]

    const editAction: RatePhaseAction = {
      key: 'edit',
      label: translate('text_1791485670326gf0h0n6l1w7'),
      startIcon: 'pen',
      disabled: isMutationDisabled,
      dataTest: RATE_PHASE_ACTION_EDIT_TEST_ID,
      onAction: () => openEditDrawer(phase),
    }

    const resetAction: RatePhaseAction = {
      key: 'reset',
      label: translate('text_1792505051513lwg9cymf8wg'),
      startIcon: 'reset',
      disabled: isMutationDisabled,
      dataTest: RATE_PHASE_ACTION_RESET_TEST_ID,
      onAction: () =>
        openResetRatePhaseOverrideDialog({
          context,
          appliedRateCardId,
          phase: getDialogPhase(phase),
        }),
    }

    const deleteAction: RatePhaseAction = {
      key: 'delete',
      label: translate('text_1791838459984x6zh06klebn'),
      startIcon: 'trash',
      disabled:
        isMutationDisabled || phases.length <= 1 || phase.billingIntervalCycleCount === null,
      dataTest: RATE_PHASE_ACTION_DELETE_TEST_ID,
      onAction: () =>
        openDeleteRatePhaseDialog({
          context,
          appliedRateCardId,
          phase: getDialogPhase(phase),
          onDeleted: () => onPhaseDeleted?.(phase),
        }),
    }

    if (!phase.rateOverride) return [copyAction, editAction, deleteAction]

    return [copyAction, editAction, resetAction, deleteAction]
  }

  return {
    getPhaseActions,
    createPhase: { hidden: !canUpdate, disabled: isMutationDisabled, open: openCreateDrawer },
  }
}
