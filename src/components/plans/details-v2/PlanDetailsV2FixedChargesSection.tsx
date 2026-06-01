import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import {
  FixedChargeDrawer,
  FixedChargeDrawerRef,
} from '~/components/plans/drawers/fixedCharge/FixedChargeDrawer'
import { FixedChargeInfo } from '~/components/plans/FixedChargeInfo'
import { LocalFixedChargeInput } from '~/components/plans/types'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import {
  CurrencyEnum,
  GraduatedChargeFragmentDoc,
  PlanDetailsV2Fragment,
  PlanInterval,
  TaxForPlanSettingsSectionFragmentDoc,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAccordionPermissions } from '~/hooks/plans/useAccordionPermissions'

import { SectionAccordion } from './shared/SectionAccordion'
import { SectionHeader } from './shared/SectionHeader'
import { PlanDetailsV2SectionId } from './sidebarSections'

gql`
  fragment FixedChargeForDetailsV2 on FixedCharge {
    id
    code
    invoiceDisplayName
    chargeModel
    units
    payInAdvance
    prorated
    properties {
      amount
      graduatedRanges {
        ...GraduatedCharge
      }
      volumeRanges {
        ...VolumeRanges
      }
    }
    addOn {
      id
      name
      code
    }
    taxes {
      id
      name
      rate
      code
    }
  }

  fragment PlanForDetailsV2FixedChargesSection on Plan {
    id
    hasOverriddenPlans
    interval
    amountCurrency
    billFixedChargesMonthly
    taxes {
      ...TaxForPlanSettingsSection
    }
    fixedCharges {
      ...FixedChargeForDetailsV2
    }
  }

  ${GraduatedChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
  ${TaxForPlanSettingsSectionFragmentDoc}
`

export type PlanDetailsV2FixedChargesSectionRef = {
  openCreate: () => void
}

export type FixedChargeMutations = {
  handleSaveCharge: (charge: LocalFixedChargeInput, index: number | null) => Promise<boolean>
  handleDeleteCharge: (chargeId: string) => Promise<boolean>
}

type Props = {
  plan: PlanDetailsV2Fragment
  isInSubscriptionForm?: boolean
  fixedChargeMutations: FixedChargeMutations
}

type FixedCharge = NonNullable<PlanDetailsV2Fragment['fixedCharges']>[number]

const toLocalInput = (fixedCharge: FixedCharge): LocalFixedChargeInput => ({
  id: fixedCharge.id,
  code: fixedCharge.code,
  addOn: fixedCharge.addOn,
  applyUnitsImmediately: false,
  chargeModel: fixedCharge.chargeModel,
  invoiceDisplayName: fixedCharge.invoiceDisplayName ?? '',
  payInAdvance: fixedCharge.payInAdvance ?? false,
  properties: fixedCharge.properties ?? {},
  prorated: fixedCharge.prorated ?? false,
  taxes: fixedCharge.taxes ?? [],
  units: fixedCharge.units ? String(fixedCharge.units) : '',
})

export const PlanDetailsV2FixedChargesSection = forwardRef<
  PlanDetailsV2FixedChargesSectionRef,
  Props
>(({ plan, isInSubscriptionForm = false, fixedChargeMutations }, ref) => {
  const { translate } = useInternationalization()
  const { canCreate, canUpdate, canDelete } = useAccordionPermissions(isInSubscriptionForm)
  const drawerRef = useRef<FixedChargeDrawerRef>(null)

  const { handleSaveCharge, handleDeleteCharge } = fixedChargeMutations

  const openCreate = () => drawerRef.current?.openDrawer()

  useImperativeHandle(ref, () => ({ openCreate }))

  const openEdit = (charge: LocalFixedChargeInput, index: number) =>
    drawerRef.current?.openDrawer(charge, index)

  const fixedCharges = plan.fixedCharges ?? []
  const isEmpty = fixedCharges.length === 0

  return (
    <section id={PlanDetailsV2SectionId.FixedCharges} className="flex scroll-mt-12 flex-col gap-6">
      <SectionHeader
        title={translate('text_1779289915866aj39dyv1wps')}
        action={
          canCreate
            ? {
                label: translate('text_176072970726882uau5y69f1'),
                onClick: openCreate,
              }
            : undefined
        }
      />

      {isEmpty && (
        <Typography variant="body" color="grey600">
          {translate('text_1779477955768bq18jsqhaom')}
        </Typography>
      )}

      {fixedCharges.map((fixedCharge, index) => (
        <SectionAccordion
          key={fixedCharge.id}
          title={fixedCharge.invoiceDisplayName || fixedCharge.addOn.name}
          subtitle={fixedCharge.addOn.code}
          actions={[
            {
              label: translate('text_63e51ef4985f0ebd75c212fc'),
              onClick: () => openEdit(toLocalInput(fixedCharge), index),
              hidden: !canUpdate,
            },
            {
              label: translate('text_63ea0f84f400488553caa786'),
              onClick: () => handleDeleteCharge(fixedCharge.id),
              hidden: !canDelete,
            },
          ]}
          noContentMargin
        >
          <FixedChargeInfo
            fixedCharge={fixedCharge}
            currency={plan.amountCurrency as CurrencyEnum}
            planInterval={plan.interval as PlanInterval}
            billFixedChargesMonthly={plan.billFixedChargesMonthly}
            planTaxes={plan.taxes}
          />
        </SectionAccordion>
      ))}

      <PlanFormProvider
        currency={plan.amountCurrency as CurrencyEnum}
        interval={(plan.interval as PlanInterval) ?? PlanInterval.Monthly}
      >
        <FixedChargeDrawer
          ref={drawerRef}
          isEdition
          onSave={handleSaveCharge}
          onDelete={(index) => {
            const target = fixedCharges[index]

            if (target) handleDeleteCharge(target.id)
          }}
        />
      </PlanFormProvider>
    </section>
  )
})

PlanDetailsV2FixedChargesSection.displayName = 'PlanDetailsV2FixedChargesSection'
