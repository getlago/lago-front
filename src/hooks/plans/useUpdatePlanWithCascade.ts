import { revalidateLogic } from '@tanstack/react-form'

import { useCascadeFormDialog } from '~/components/plans/details-v2/shared/useCascadeFormDialog'
import { PlanFormInput } from '~/components/plans/types'
import { serializePlanInput } from '~/core/serializers'
import { planFormSchema } from '~/formValidation/planFormSchema'
import { PlanDetailsV2Fragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { usePlanUpdate } from '~/hooks/plans/usePlanUpdate'
import { buildPlanSettingsValues } from '~/hooks/plans/utils'

type UseUpdatePlanWithCascadeOptions = {
  plan: PlanDetailsV2Fragment
  onSuccess?: () => void
}

export const buildUpdatePlanFormDefaults = (plan: PlanDetailsV2Fragment): PlanFormInput => {
  const settingsDefaults = buildPlanSettingsValues(plan)

  return {
    ...settingsDefaults,
    // PlanSettingsSection only reads fixedCharges.length / charges.length to
    // gate the bill*Monthly switches. We seed length-only stubs and cast to
    // satisfy PlanFormInput — neither the form nor the mutation touches the
    // contents.
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

export const useUpdatePlanWithCascade = ({ plan, onSuccess }: UseUpdatePlanWithCascadeOptions) => {
  const { translate } = useInternationalization()
  const { openCascadeDialog } = useCascadeFormDialog()

  const { update } = usePlanUpdate({
    onSuccess() {
      onSuccess?.()
    },
  })

  const form = useAppForm({
    defaultValues: buildUpdatePlanFormDefaults(plan),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: planFormSchema },
    onSubmit: async ({ value }) => {
      const serialized = serializePlanInput(value)

      await update({ variables: { input: { ...serialized, id: plan.id } } })
    },
  })

  const submit = () => {
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

  return { form, submit }
}
