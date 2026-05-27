import { useRef } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import {
  MinimumCommitmentDrawer,
  MinimumCommitmentDrawerRef,
  MinimumCommitmentFormValues,
} from '~/components/plans/drawers/minimumCommitment/MinimumCommitmentDrawer'
import { MinimumCommitmentInfo } from '~/components/plans/MinimumCommitmentInfo'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { CommitmentTypeEnum, CurrencyEnum, PlanDetailsV2Fragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  buildUpdatePlanFormDefaults,
  useUpdatePlanWithCascade,
} from '~/hooks/plans/useUpdatePlanWithCascade'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

import { SectionAccordion } from '../shared/SectionAccordion'
import { SectionHeader } from '../shared/SectionHeader'
import { PlanDetailsV2SectionId } from '../sidebarSections'

type MinimumCommitmentAccordionProps = {
  plan: PlanDetailsV2Fragment
  isInSubscriptionForm?: boolean
}

export const MinimumCommitmentAccordion = ({
  plan,
  isInSubscriptionForm = false,
}: MinimumCommitmentAccordionProps) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const drawerRef = useRef<MinimumCommitmentDrawerRef>(null)

  const canCreate = hasPermissions(['plansCreate']) && !isInSubscriptionForm
  const canUpdate = hasPermissions(['plansUpdate']) && !isInSubscriptionForm
  const canDelete = hasPermissions(['plansDelete']) && !isInSubscriptionForm

  const currency = plan.amountCurrency || CurrencyEnum.Usd
  const commitment = plan.minimumCommitment
  const hasCommitment = !!commitment?.amountCents && !isNaN(Number(commitment.amountCents))

  const { form, submit } = useUpdatePlanWithCascade({ plan, includeAdvancedFields: true })

  const applyAndSubmit = (mutate: () => void): Promise<boolean> => {
    form.reset(buildUpdatePlanFormDefaults(plan), { keepDefaultValues: true })
    mutate()
    return submit()
  }

  const handleSave = (values: MinimumCommitmentFormValues): Promise<boolean> =>
    applyAndSubmit(() =>
      form.setFieldValue('minimumCommitment', {
        ...values,
        commitmentType: CommitmentTypeEnum.MinimumCommitment,
      }),
    )

  const handleDelete = (): Promise<boolean> =>
    applyAndSubmit(() => form.setFieldValue('minimumCommitment', {}))

  const openEditDrawer = () =>
    drawerRef.current?.openDrawer({
      amountCents: commitment?.amountCents ? String(commitment.amountCents) : '',
      invoiceDisplayName: commitment?.invoiceDisplayName || undefined,
      taxes: commitment?.taxes || [],
    })

  const intervalBadge = plan.interval ? (
    <Chip label={translate(getIntervalTranslationKey[plan.interval])} />
  ) : undefined

  return (
    <section id={PlanDetailsV2SectionId.MinimumCommitment} className="flex scroll-mt-12 flex-col gap-6">
      <SectionHeader
        title={translate('text_65d601bffb11e0f9d1d9f569')}
        description={translate('text_6661fc17337de3591e29e451', {
          interval: translate(mapChargeIntervalCopy(plan.interval, false)).toLocaleLowerCase(),
        })}
        action={{
          label: translate('text_6661ffe746c680007e2df0e1'),
          onClick: () => drawerRef.current?.openDrawer(),
          hidden: !canCreate || hasCommitment || !isPremium,
        }}
      />

      {!isPremium && !hasCommitment && (
        <PremiumFeature
          title={translate('text_17700400130439xuo82ha60n')}
          description={translate('text_1770040013043awgs0eemonf')}
          feature={translate('text_65d601bffb11e0f9d1d9f569')}
        />
      )}

      {hasCommitment && (
        <SectionAccordion
          title={commitment?.invoiceDisplayName || translate('text_65d601bffb11e0f9d1d9f569')}
          badge={intervalBadge}
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
          <MinimumCommitmentInfo plan={plan} currency={currency} />
        </SectionAccordion>
      )}

      <PlanFormProvider currency={currency} interval={plan.interval}>
        <MinimumCommitmentDrawer
          ref={drawerRef}
          onSave={handleSave}
          onDelete={() => void handleDelete()}
        />
      </PlanFormProvider>
    </section>
  )
}
