import { gql } from '@apollo/client'
import { useRef } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import {
  SubscriptionFeeDrawer,
  SubscriptionFeeDrawerRef,
  SubscriptionFeeFormValues,
} from '~/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer'
import { SubscriptionFeeInfo } from '~/components/plans/SubscriptionFeeInfo'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { PlanDetailsV2Fragment, PlanForUpdateWithCascadeFragmentDoc } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdatePlanWithCascade } from '~/hooks/plans/useUpdatePlanWithCascade'
import { usePermissions } from '~/hooks/usePermissions'

import { SectionAccordion } from './shared/SectionAccordion'
import { PlanDetailsV2SectionId } from './sidebarSections'

gql`
  fragment PlanForDetailsV2SubscriptionFeeAccordion on Plan {
    amountCents
    payInAdvance
    trialPeriod
    invoiceDisplayName
    interval
    amountCurrency
    ...PlanForUpdateWithCascade
  }

  ${PlanForUpdateWithCascadeFragmentDoc}
`

type SubscriptionFeeAccordionProps = {
  plan: PlanDetailsV2Fragment
  isInSubscriptionForm?: boolean
}

export const SubscriptionFeeAccordion = ({
  plan,
  isInSubscriptionForm = false,
}: SubscriptionFeeAccordionProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const drawerRef = useRef<SubscriptionFeeDrawerRef>(null)

  const canUpdate = hasPermissions(['plansUpdate']) && !isInSubscriptionForm

  const { form, submit } = useUpdatePlanWithCascade({ plan })

  const openDrawer = () => {
    drawerRef.current?.openDrawer({
      amountCents:
        plan.amountCents !== null && plan.amountCents !== undefined ? String(plan.amountCents) : '',
      payInAdvance: plan.payInAdvance ?? false,
      trialPeriod: plan.trialPeriod ?? 0,
      invoiceDisplayName: plan.invoiceDisplayName ?? undefined,
    })
  }

  const handleDrawerSave = async (values: SubscriptionFeeFormValues): Promise<boolean> => {
    form.setFieldValue('amountCents', values.amountCents)
    form.setFieldValue('payInAdvance', values.payInAdvance)
    form.setFieldValue('trialPeriod', values.trialPeriod)
    form.setFieldValue('invoiceDisplayName', values.invoiceDisplayName)
    return submit()
  }

  const intervalBadge = plan.interval ? (
    <Chip label={translate(getIntervalTranslationKey[plan.interval])} />
  ) : undefined

  return (
    <>
      <SectionAccordion
        id={PlanDetailsV2SectionId.SubscriptionFee}
        title={plan.invoiceDisplayName || translate('text_642d5eb2783a2ad10d670336')}
        badge={intervalBadge}
        actions={[
          {
            label: translate('text_63e51ef4985f0ebd75c212fc'),
            onClick: openDrawer,
            hidden: !canUpdate,
          },
        ]}
      >
        <SubscriptionFeeInfo plan={plan} />
      </SectionAccordion>

      <PlanFormProvider currency={plan.amountCurrency} interval={plan.interval}>
        <SubscriptionFeeDrawer ref={drawerRef} onSave={handleDrawerSave} isEdition />
      </PlanFormProvider>
    </>
  )
}
