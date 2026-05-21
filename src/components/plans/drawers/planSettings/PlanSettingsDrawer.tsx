import { revalidateLogic } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { useCascadeFormDialog } from '~/components/plans/details-v2/shared/useCascadeFormDialog'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { PlanFormInput } from '~/components/plans/types'
import { serializePlanInput } from '~/core/serializers'
import { planFormSchema } from '~/formValidation/planFormSchema'
import { PlanDetailsV2Fragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { usePlanUpdate } from '~/hooks/plans/usePlanUpdate'
import { buildPlanSettingsValues } from '~/hooks/plans/utils'

const PLAN_SETTINGS_FORM_ID = 'plan-settings-drawer-form'

export interface PlanSettingsDrawerRef {
  openDrawer: () => void
  closeDrawer: () => void
}

type PlanSettingsDrawerProps = {
  plan: PlanDetailsV2Fragment
}

const buildDrawerDefaults = (plan: PlanDetailsV2Fragment): PlanFormInput => {
  const settingsDefaults = buildPlanSettingsValues(plan)

  return {
    ...settingsDefaults,
    // PlanSettingsSection only reads fixedCharges.length / charges.length to
    // gate the bill*Monthly switches. We seed length-only stubs and cast to
    // satisfy PlanFormInput — the drawer never edits these arrays.
    fixedCharges: settingsDefaults.fixedCharges as unknown as PlanFormInput['fixedCharges'],
    charges: settingsDefaults.charges as unknown as PlanFormInput['charges'],
    amountCents: '0',
    trialPeriod: 0,
    payInAdvance: false,
    minimumCommitment: {},
    entitlements: [],
    nonRecurringUsageThresholds: undefined,
    recurringUsageThreshold: undefined,
    invoiceDisplayName: undefined,
    cascadeUpdates: undefined,
  }
}

export const PlanSettingsDrawer = forwardRef<PlanSettingsDrawerRef, PlanSettingsDrawerProps>(
  ({ plan }, ref) => {
    const { translate } = useInternationalization()
    const drawer = useFormDrawer()
    const { openCascadeDialog } = useCascadeFormDialog()

    const { update } = usePlanUpdate({
      onSuccess() {
        drawer.close()
      },
    })

    const form = useAppForm({
      defaultValues: buildDrawerDefaults(plan),
      validationLogic: revalidateLogic(),
      validators: { onDynamic: planFormSchema },
      onSubmit: async ({ value }) => {
        const serialized = serializePlanInput(value)

        await update({ variables: { input: { ...serialized, id: plan.id } } })
      },
    })

    const handleSubmit = () => {
      if (plan.hasOverriddenPlans) {
        return openCascadeDialog({
          title: translate('text_1729604107534r3hsj7i64gp'),
          mainActionLabel: translate('text_1729604107534dfyz8j53ho5'),
          hasOverriddenPlans: true,
          onConfirm: async (cascadeUpdates) => {
            form.setFieldValue('cascadeUpdates', cascadeUpdates)
            await form.handleSubmit()
          },
        })
      }

      return form.handleSubmit()
    }

    const openSettingsDrawer = () => {
      form.reset(buildDrawerDefaults(plan), { keepDefaultValues: true })

      drawer.open({
        title: translate('text_642d5eb2783a2ad10d67031a'),
        form: { id: PLAN_SETTINGS_FORM_ID, submit: handleSubmit },
        mainAction: (
          <form.Subscribe selector={({ canSubmit }) => canSubmit}>
            {(canSubmit) => (
              <Button
                data-test="plan-settings-drawer-save"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {translate('text_17295436903260tlyb1gp1i7')}
              </Button>
            )}
          </form.Subscribe>
        ),
        children: <PlanSettingsSection form={form} canBeEdited isEdition />,
      })
    }

    useImperativeHandle(ref, () => ({
      openDrawer: openSettingsDrawer,
      closeDrawer: () => drawer.close(),
    }))

    return null
  },
)

PlanSettingsDrawer.displayName = 'PlanSettingsDrawer'
