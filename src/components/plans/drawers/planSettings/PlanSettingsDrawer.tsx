import { forwardRef, useImperativeHandle } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { PlanDetailsV2Fragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  buildUpdatePlanFormDefaults,
  useUpdatePlanWithCascade,
} from '~/hooks/plans/useUpdatePlanWithCascade'

const PLAN_SETTINGS_FORM_ID = 'plan-settings-drawer-form'

export interface PlanSettingsDrawerRef {
  openDrawer: () => void
  closeDrawer: () => void
}

type PlanSettingsDrawerProps = {
  plan: PlanDetailsV2Fragment
}

export const PlanSettingsDrawer = forwardRef<PlanSettingsDrawerRef, PlanSettingsDrawerProps>(
  ({ plan }, ref) => {
    const { translate } = useInternationalization()
    const drawer = useFormDrawer()

    const { form, submit } = useUpdatePlanWithCascade({
      plan,
      onSuccess() {
        drawer.close()
      },
    })

    const openSettingsDrawer = () => {
      form.reset(buildUpdatePlanFormDefaults(plan), { keepDefaultValues: true })

      drawer.open({
        title: translate('text_642d5eb2783a2ad10d67031a'),
        form: { id: PLAN_SETTINGS_FORM_ID, submit },
        mainAction: (
          <form.Subscribe selector={({ canSubmit }) => canSubmit}>
            {(canSubmit) => (
              <Button data-test="plan-settings-drawer-save" onClick={submit} disabled={!canSubmit}>
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
