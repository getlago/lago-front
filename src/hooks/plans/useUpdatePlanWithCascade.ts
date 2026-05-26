import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'

import { useCascadeFormDialog } from '~/components/plans/details-v2/shared/useCascadeFormDialog'
import { PlanFormInput } from '~/components/plans/types'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import { planSettingsOnlyFormSchema } from '~/formValidation/planFormSchema'
import {
  PlanDetailsV2Fragment,
  TaxForPlanSettingsSectionFragmentDoc,
  UpdatePlanInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { usePlanUpdate } from '~/hooks/plans/usePlanUpdate'
import { buildPlanSettingsValues } from '~/hooks/plans/utils'

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
      // Settings-only flow: charges + fixedCharges are now optional on
      // UpdatePlanInput, so omit them from the payload entirely. BE preserves
      // existing entries via partial-update semantics.
      const input: UpdatePlanInput = {
        id: plan.id,
        name: value.name,
        code: value.code,
        description: value.description || undefined,
        interval: value.interval,
        amountCurrency: value.amountCurrency,
        amountCents: Number(serializeAmount(value.amountCents, value.amountCurrency)),
        payInAdvance: value.payInAdvance,
        trialPeriod: Number(value.trialPeriod || 0),
        invoiceDisplayName: value.invoiceDisplayName || undefined,
        billChargesMonthly: value.billChargesMonthly,
        billFixedChargesMonthly: value.billFixedChargesMonthly,
        taxCodes: value.taxes?.map((tax) => tax.code) ?? [],
        cascadeUpdates: value.cascadeUpdates,
      }

      await update({ variables: { input } })
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
