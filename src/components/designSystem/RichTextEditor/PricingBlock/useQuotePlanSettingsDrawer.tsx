import { useCallback } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import type { PlanFormType } from '~/hooks/plans/usePlanForm'

export const useQuotePlanSettingsDrawer = (planForm: PlanFormType) => {
  const { translate } = useInternationalization()
  const drawer = useDrawer()

  const openDrawer = useCallback(() => {
    drawer.open({
      title: translate('text_642d5eb2783a2ad10d67031a'),
      children: <PlanSettingsSection form={planForm} />,
      actions: (
        <div className="flex items-center justify-end gap-3">
          <Button variant="quaternary" onClick={() => drawer.close()}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button data-test="plan-settings-drawer-save" onClick={() => drawer.close()}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </Button>
        </div>
      ),
    })
  }, [drawer, planForm, translate])

  return { openDrawer }
}
