import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'

import { useCascadeFormDialog } from '~/components/plans/details-v2/shared/useCascadeFormDialog'
import { PlanFormInput } from '~/components/plans/types'
import { serializePlanInput } from '~/core/serializers'
import { planSettingsOnlyFormSchema } from '~/formValidation/planFormSchema'
import { PlanDetailsV2Fragment, TaxForPlanSettingsSectionFragmentDoc } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { usePlanUpdate } from '~/hooks/plans/usePlanUpdate'
import {
  buildPlanSettingsValues,
  toLocalFixedChargeInput,
  toLocalUsageChargeInput,
} from '~/hooks/plans/utils'

gql`
  fragment PlanForUpdateWithCascade on Plan {
    id
    name
    code
    description
    interval
    amountCurrency
    billChargesMonthly
    billFixedChargesMonthly
    hasOverriddenPlans
    taxes {
      ...TaxForPlanSettingsSection
    }
    fixedCharges {
      id
    }
    charges {
      id
    }
  }

  ${TaxForPlanSettingsSectionFragmentDoc}
`

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
  const { hasAnyPricingUnitConfigured } = useCustomPricingUnits()

  const { update } = usePlanUpdate({
    onSuccess() {
      onSuccess?.()
    },
  })

  const form = useAppForm({
    defaultValues: buildUpdatePlanFormDefaults(plan),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: planSettingsOnlyFormSchema },
    onSubmit: async ({ value }) => {
      // Form holds id-only charge stubs because this hook drives settings-only
      // drawers. updatePlan's input requires the full charges + fixedCharges
      // arrays, so hydrate them from the plan prop (PlanDetailsV2Fragment
      // carries the detailed shapes via the FixedCharges + UsageCharges
      // section fragments) before running through the shared serializer.
      const hydratedValue: PlanFormInput = {
        ...value,
        charges: (plan.charges ?? []).map((charge) =>
          toLocalUsageChargeInput(charge, value.amountCurrency, hasAnyPricingUnitConfigured),
        ),
        fixedCharges: (plan.fixedCharges ?? []).map(toLocalFixedChargeInput),
      }
      const serialized = serializePlanInput(hydratedValue)

      await update({ variables: { input: { ...serialized, id: plan.id } } })
    },
  })

  const submit = async (): Promise<boolean> => {
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

    await form.handleSubmit()
    return true
  }

  return { form, submit }
}
