import { useRef } from 'react'

import {
  FeatureEntitlementDrawer,
  FeatureEntitlementDrawerRef,
  FeatureEntitlementFormValues,
} from '~/components/plans/drawers/featureEntitlement/FeatureEntitlementDrawer'
import { EntitlementInfo } from '~/components/plans/EntitlementInfo'
import { PlanDetailsV2Fragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  buildUpdatePlanFormDefaults,
  useUpdatePlanWithCascade,
} from '~/hooks/plans/useUpdatePlanWithCascade'
import { usePermissions } from '~/hooks/usePermissions'

import { SectionAccordion } from '../shared/SectionAccordion'
import { SectionHeader } from '../shared/SectionHeader'
import { PlanDetailsV2SectionId } from '../sidebarSections'

type EntitlementAccordionProps = {
  plan: PlanDetailsV2Fragment
  isInSubscriptionForm?: boolean
}

export const EntitlementAccordion = ({
  plan,
  isInSubscriptionForm = false,
}: EntitlementAccordionProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const drawerRef = useRef<FeatureEntitlementDrawerRef>(null)

  const canCreate = hasPermissions(['plansCreate']) && !isInSubscriptionForm
  const canUpdate = hasPermissions(['plansUpdate']) && !isInSubscriptionForm
  const canDelete = hasPermissions(['plansDelete']) && !isInSubscriptionForm

  const entitlements = plan.entitlements ?? []

  const { form, submit } = useUpdatePlanWithCascade({ plan, includeAdvancedFields: true })

  const applyAndSubmit = (mutate: () => void): Promise<boolean> => {
    form.reset(buildUpdatePlanFormDefaults(plan), { keepDefaultValues: true })
    mutate()
    return submit()
  }

  const handleSave = (values: FeatureEntitlementFormValues): Promise<boolean> =>
    applyAndSubmit(() => {
      const current = form.state.values.entitlements || []
      const idx = current.findIndex((e) => e.featureCode === values.featureCode)
      const next = {
        featureId: values.featureId,
        featureName: values.featureName,
        featureCode: values.featureCode,
        privileges: values.privileges,
      }
      const updated = [...current]

      if (idx >= 0) {
        updated[idx] = next
      } else {
        updated.push(next)
      }
      form.setFieldValue('entitlements', updated)
    })

  const handleDelete = (featureCode: string): Promise<boolean> =>
    applyAndSubmit(() =>
      form.setFieldValue(
        'entitlements',
        (form.state.values.entitlements || []).filter((e) => e.featureCode !== featureCode),
      ),
    )

  return (
    <section id={PlanDetailsV2SectionId.Entitlements} className="flex scroll-mt-12 flex-col gap-6">
      <SectionHeader
        title={translate('text_63e26d8308d03687188221a6')}
        description={translate('text_17538642230602p03937fj0f')}
        action={{
          label: translate('text_1753864223060devvklm7vk0'),
          onClick: () => drawerRef.current?.openDrawer(),
          hidden: !canCreate,
        }}
      />

      {entitlements.map((entitlement) => (
        <SectionAccordion
          key={`entitlement-${entitlement.code}`}
          title={entitlement.name || entitlement.code}
          subtitle={entitlement.code}
          actions={[
            {
              label: translate('text_63e51ef4985f0ebd75c212fc'),
              onClick: () =>
                drawerRef.current?.openDrawer({
                  featureId: '',
                  featureName: entitlement.name || '',
                  featureCode: entitlement.code,
                  privileges: entitlement.privileges.map((p) => ({
                    privilegeCode: p.code,
                    privilegeName: p.name,
                    value: p.value,
                    valueType: p.valueType,
                    config: p.config,
                  })),
                }),
              hidden: !canUpdate,
            },
            {
              label: translate('text_63ea0f84f400488553caa786'),
              onClick: () => void handleDelete(entitlement.code),
              hidden: !canDelete,
            },
          ]}
        >
          <EntitlementInfo entitlement={entitlement} />
        </SectionAccordion>
      ))}

      <FeatureEntitlementDrawer
        ref={drawerRef}
        existingFeatureCodes={entitlements.map((e) => e.code)}
        onSave={handleSave}
        onDelete={(featureCode) => void handleDelete(featureCode)}
      />
    </section>
  )
}
