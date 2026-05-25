import { gql } from '@apollo/client'
import { useRef } from 'react'

import {
  PlanSettingsDrawer,
  PlanSettingsDrawerRef,
} from '~/components/plans/drawers/planSettings/PlanSettingsDrawer'
import { PlanSettingsInfo } from '~/components/plans/PlanSettingsInfo'
import {
  PlanDetailsV2Fragment,
  PlanForDetailsV2SubscriptionFeeAccordionFragmentDoc,
  PlanForUpdateWithCascadeFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { SectionAccordion } from './shared/SectionAccordion'
import { SectionHeader } from './shared/SectionHeader'
import { PlanDetailsV2SectionId } from './sidebarSections'
import { SubscriptionFeeAccordion } from './SubscriptionFeeAccordion'

gql`
  fragment PlanForDetailsV2PlanSettingsSection on Plan {
    ...PlanForUpdateWithCascade
    ...PlanForDetailsV2SubscriptionFeeAccordion
  }

  ${PlanForUpdateWithCascadeFragmentDoc}
  ${PlanForDetailsV2SubscriptionFeeAccordionFragmentDoc}
`

type PlanDetailsV2PlanSettingsSectionProps = {
  plan: PlanDetailsV2Fragment
  isInSubscriptionForm?: boolean
}

export const PlanDetailsV2PlanSettingsSection = ({
  plan,
  isInSubscriptionForm = false,
}: PlanDetailsV2PlanSettingsSectionProps) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<PlanSettingsDrawerRef>(null)

  return (
    <section id={PlanDetailsV2SectionId.PlanSettings} className="flex scroll-mt-12 flex-col gap-6">
      <SectionHeader
        title={translate('text_642d5eb2783a2ad10d67031a')}
        description={translate('text_6661fc17337de3591e29e3c1')}
      />
      <SectionAccordion
        title={translate('text_642d5eb2783a2ad10d67031a')}
        initiallyOpen
        actions={[
          {
            label: translate('text_63e51ef4985f0ebd75c212fc'),
            onClick: () => drawerRef.current?.openDrawer(),
            hidden: isInSubscriptionForm,
          },
        ]}
      >
        <PlanSettingsInfo plan={plan} />
      </SectionAccordion>

      <SubscriptionFeeAccordion plan={plan} isInSubscriptionForm={isInSubscriptionForm} />

      <PlanSettingsDrawer ref={drawerRef} plan={plan} />
    </section>
  )
}
