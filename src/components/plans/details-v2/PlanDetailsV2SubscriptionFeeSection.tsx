import { Icon } from 'lago-design-system'
import { useRef } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import {
  SubscriptionFeeDrawer,
  SubscriptionFeeDrawerRef,
  SubscriptionFeeFormValues,
} from '~/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { PlanDetailsV2Fragment, PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdatePlanWithCascade } from '~/hooks/plans/useUpdatePlanWithCascade'

import { SubscriptionFeeAccordion } from './accordions/SubscriptionFeeAccordion'
import { SectionAccordion } from './shared/SectionAccordion'
import { SectionHeader } from './shared/SectionHeader'
import { PlanDetailsV2SectionId } from './sidebarSections'

type PlanDetailsV2SubscriptionFeeSectionProps = {
  plan: PlanDetailsV2Fragment
  isInSubscriptionForm?: boolean
}

export const PlanDetailsV2SubscriptionFeeSection = ({
  plan,
  isInSubscriptionForm = false,
}: PlanDetailsV2SubscriptionFeeSectionProps) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<SubscriptionFeeDrawerRef>(null)

  const { form, submit } = useUpdatePlanWithCascade({ plan })

  const openDrawer = () => {
    drawerRef.current?.openDrawer({
      amountCents: plan.amountCents != null ? String(plan.amountCents) : '',
      payInAdvance: plan.payInAdvance ?? false,
      trialPeriod: plan.trialPeriod ?? 0,
      invoiceDisplayName: plan.invoiceDisplayName ?? undefined,
    })
  }

  const handleDrawerSave = (values: SubscriptionFeeFormValues) => {
    form.setFieldValue('amountCents', values.amountCents)
    form.setFieldValue('payInAdvance', values.payInAdvance)
    form.setFieldValue('trialPeriod', values.trialPeriod)
    form.setFieldValue('invoiceDisplayName', values.invoiceDisplayName)
    submit()
  }

  const intervalBadge = plan.interval ? (
    <Chip label={translate(getIntervalTranslationKey[plan.interval as PlanInterval])} />
  ) : undefined

  return (
    <section
      id={PlanDetailsV2SectionId.SubscriptionFee}
      className="flex scroll-mt-12 flex-col gap-6"
    >
      <SectionHeader title={translate('text_642d5eb2783a2ad10d670336')} />
      <SectionAccordion
        icon={<Icon name="file" size="small" color="dark" />}
        title={plan.invoiceDisplayName || translate('text_642d5eb2783a2ad10d670336')}
        badge={intervalBadge}
        initiallyOpen
        actions={[
          {
            label: translate('text_63e51ef4985f0ebd75c212fc'),
            onClick: openDrawer,
            hidden: isInSubscriptionForm,
          },
        ]}
      >
        <SubscriptionFeeAccordion plan={plan} />
      </SectionAccordion>

      <SubscriptionFeeDrawer ref={drawerRef} onSave={handleDrawerSave} isEdition />
    </section>
  )
}
