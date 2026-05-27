import { useRef } from 'react'

import { ProgressiveBillingFormValues } from '~/components/plans/drawers/progressiveBilling/constants'
import {
  ProgressiveBillingDrawer,
  ProgressiveBillingDrawerRef,
} from '~/components/plans/drawers/progressiveBilling/ProgressiveBillingDrawer'
import { ProgressiveBillingInfo } from '~/components/plans/ProgressiveBillingInfo'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import {
  CurrencyEnum,
  PlanDetailsV2Fragment,
  PremiumIntegrationTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  buildUpdatePlanFormDefaults,
  useUpdatePlanWithCascade,
} from '~/hooks/plans/useUpdatePlanWithCascade'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { SectionAccordion } from '../shared/SectionAccordion'
import { SectionHeader } from '../shared/SectionHeader'
import { PlanDetailsV2SectionId } from '../sidebarSections'

type ProgressiveBillingAccordionProps = {
  plan: PlanDetailsV2Fragment
  isInSubscriptionForm?: boolean
}

export const ProgressiveBillingAccordion = ({
  plan,
  isInSubscriptionForm = false,
}: ProgressiveBillingAccordionProps) => {
  const { translate } = useInternationalization()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()
  const drawerRef = useRef<ProgressiveBillingDrawerRef>(null)

  const canCreate = hasPermissions(['plansCreate']) && !isInSubscriptionForm
  const canUpdate = hasPermissions(['plansUpdate']) && !isInSubscriptionForm
  const canDelete = hasPermissions(['plansDelete']) && !isInSubscriptionForm

  const currency = plan.amountCurrency || CurrencyEnum.Usd
  const hasThresholds = !!plan.usageThresholds?.length
  const thresholdCount = plan.usageThresholds?.length ?? 0
  const hasPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )

  const { form, submit } = useUpdatePlanWithCascade({ plan, includeAdvancedFields: true })

  const applyAndSubmit = (mutate: () => void): Promise<boolean> => {
    form.reset(buildUpdatePlanFormDefaults(plan), { keepDefaultValues: true })
    mutate()
    return submit()
  }

  const handleSave = (values: ProgressiveBillingFormValues): Promise<boolean> =>
    applyAndSubmit(() => {
      form.setFieldValue('nonRecurringUsageThresholds', values.nonRecurringUsageThresholds)
      form.setFieldValue('recurringUsageThreshold', values.recurringUsageThreshold)
    })

  const handleDelete = (): Promise<boolean> =>
    applyAndSubmit(() => {
      form.setFieldValue('nonRecurringUsageThresholds', undefined)
      form.setFieldValue('recurringUsageThreshold', undefined)
    })

  const openEditDrawer = () => {
    const nonRecurring = (plan.usageThresholds ?? [])
      .filter((t) => !t.recurring)
      .map((t) => ({
        amountCents: String(t.amountCents),
        thresholdDisplayName: t.thresholdDisplayName ?? undefined,
        recurring: false as const,
      }))
    const recurring = (plan.usageThresholds ?? []).find((t) => t.recurring)

    drawerRef.current?.openDrawer({
      nonRecurringUsageThresholds: nonRecurring,
      recurringUsageThreshold: recurring
        ? {
            amountCents: String(recurring.amountCents),
            thresholdDisplayName: recurring.thresholdDisplayName ?? undefined,
            recurring: true as const,
          }
        : undefined,
    })
  }

  return (
    <section
      id={PlanDetailsV2SectionId.ProgressiveBilling}
      className="flex scroll-mt-12 flex-col gap-6"
    >
      <SectionHeader
        title={translate('text_1724179887722baucvj7bvc1')}
        description={translate('text_1724179887723kdf3nisf6hp')}
        action={{
          label: translate('text_1724233213996upb98e8b8xx'),
          onClick: () => drawerRef.current?.openDrawer(),
          hidden: !canCreate || hasThresholds || !hasPremiumIntegration,
        }}
      />

      {!hasThresholds && !hasPremiumIntegration && (
        <PremiumFeature
          title={translate('text_1724345142892pcnx5m2k3r2')}
          description={translate('text_1724345142892ljzi79afhmc')}
          feature={translate('text_1724179887722baucvj7bvc1')}
        />
      )}

      {hasThresholds && (
        <SectionAccordion
          title={translate('text_1724179887722baucvj7bvc1')}
          subtitle={translate('text_1773950414511euzjefq877r', { thresholdCount }, thresholdCount)}
          actions={[
            {
              label: translate('text_63e51ef4985f0ebd75c212fc'),
              onClick: openEditDrawer,
              hidden: !canUpdate,
            },
            {
              label: translate('text_63ea0f84f400488553caa786'),
              onClick: () => void handleDelete(),
              hidden: !canDelete,
            },
          ]}
        >
          <ProgressiveBillingInfo plan={plan} currency={currency} />
        </SectionAccordion>
      )}

      <PlanFormProvider currency={currency} interval={plan.interval}>
        <ProgressiveBillingDrawer
          ref={drawerRef}
          onSave={handleSave}
          onDelete={() => void handleDelete()}
        />
      </PlanFormProvider>
    </section>
  )
}
