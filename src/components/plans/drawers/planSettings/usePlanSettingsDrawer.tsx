import { Button } from '~/components/designSystem/Button'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { PlanDetailsV2Fragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  buildUpdatePlanFormDefaults,
  useUpdatePlanWithCascade,
} from '~/hooks/plans/useUpdatePlanWithCascade'
import { useUpdateSubscriptionPlanOverride } from '~/hooks/plans/useUpdateSubscriptionPlanOverride'

const PLAN_SETTINGS_FORM_ID = 'plan-settings-drawer-form'

export const usePlanSettingsDrawer = (plan: PlanDetailsV2Fragment, subscriptionId?: string) => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const { form, submit } = useUpdatePlanWithCascade({
    plan,
    onSuccess() {
      drawer.close()
    },
  })
  const { updatePlanOverride } = useUpdateSubscriptionPlanOverride({
    subscriptionId: subscriptionId ?? '',
  })

  // Sub mode: route the editable settings (name + description + taxes — the
  // PlanOverridesInput-backed fields not already disabled) through
  // updateSubscription(planOverrides); never call updatePlan, which would
  // mutate the shared base plan (R3). Plan mode keeps the cascade submit.
  const handleSubmit = async () => {
    if (subscriptionId) {
      const values = form.state.values
      const success = await updatePlanOverride({
        name: values.name,
        description: values.description || null,
        taxCodes: values.taxes?.map((tax) => tax.code) ?? [],
      })

      if (success) drawer.close()
      return
    }

    await submit()
  }

  const openDrawer = () => {
    form.reset(buildUpdatePlanFormDefaults(plan), { keepDefaultValues: true })

    const submitVoid = () => {
      void handleSubmit()
    }

    drawer.open({
      title: translate('text_642d5eb2783a2ad10d67031a'),
      form: { id: PLAN_SETTINGS_FORM_ID, submit: submitVoid },
      mainAction: (
        <form.Subscribe selector={({ canSubmit }) => canSubmit}>
          {(canSubmit) => (
            <Button
              data-test="plan-settings-drawer-save"
              onClick={submitVoid}
              disabled={!canSubmit}
            >
              {translate('text_17295436903260tlyb1gp1i7')}
            </Button>
          )}
        </form.Subscribe>
      ),
      children: (
        <PlanSettingsSection
          form={form}
          canBeEdited
          isEdition
          isInSubscriptionForm={!!subscriptionId}
          subscriptionFormType={subscriptionId ? FORM_TYPE_ENUM.edition : undefined}
        />
      ),
    })
  }

  return { openDrawer }
}
