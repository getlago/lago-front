import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import {
  UsageChargeDrawer,
  UsageChargeDrawerRef,
} from '~/components/plans/drawers/usageCharge/UsageChargeDrawer'
import { LocalPricingUnitType, LocalUsageChargeInput } from '~/components/plans/types'
import { UsageChargeInfo } from '~/components/plans/UsageChargeInfo'
import { transformFilterObjectToString } from '~/components/plans/utils'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  CustomChargeFragmentDoc,
  GraduatedChargeFragmentDoc,
  GraduatedPercentageChargeFragmentDoc,
  PackageChargeFragmentDoc,
  PercentageChargeFragmentDoc,
  PlanForDetailsV2UsageChargesSectionFragment,
  PlanInterval,
  PricingGroupKeysFragmentDoc,
  StandardChargeFragmentDoc,
  TaxForPlanSettingsSectionFragmentDoc,
  TaxForTaxesSelectorSectionFragmentDoc,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useChargeMutationsWithCascade } from '~/hooks/plans/useChargeMutationsWithCascade'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { usePermissions } from '~/hooks/usePermissions'

import { SectionAccordion } from './shared/SectionAccordion'
import { SectionHeader } from './shared/SectionHeader'
import { PlanDetailsV2SectionId } from './sidebarSections'

gql`
  fragment UsageChargeForDetailsV2 on Charge {
    id
    chargeModel
    invoiceable
    invoiceDisplayName
    minAmountCents
    payInAdvance
    prorated
    regroupPaidFees
    properties {
      graduatedRanges {
        ...GraduatedCharge
      }
      graduatedPercentageRanges {
        ...GraduatedPercentageCharge
      }
      volumeRanges {
        ...VolumeRanges
      }
      ...PackageCharge
      ...StandardCharge
      ...PercentageCharge
      ...CustomCharge
      ...PricingGroupKeys
    }
    filters {
      id
      invoiceDisplayName
      values
      properties {
        graduatedRanges {
          ...GraduatedCharge
        }
        graduatedPercentageRanges {
          ...GraduatedPercentageCharge
        }
        volumeRanges {
          ...VolumeRanges
        }
        ...PackageCharge
        ...StandardCharge
        ...PercentageCharge
        ...CustomCharge
        ...PricingGroupKeys
      }
    }
    appliedPricingUnit {
      conversionRate
      pricingUnit {
        id
        name
        code
        shortName
      }
    }
    billableMetric {
      id
      name
      code
      aggregationType
      recurring
      filters {
        key
        values
      }
    }
    taxes {
      ...TaxForTaxesSelectorSection
    }
  }

  fragment PlanForDetailsV2UsageChargesSection on Plan {
    id
    hasOverriddenPlans
    interval
    amountCurrency
    billChargesMonthly
    taxes {
      ...TaxForPlanSettingsSection
    }
    charges {
      ...UsageChargeForDetailsV2
    }
  }

  ${GraduatedChargeFragmentDoc}
  ${GraduatedPercentageChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${StandardChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
  ${CustomChargeFragmentDoc}
  ${PricingGroupKeysFragmentDoc}
  ${TaxForTaxesSelectorSectionFragmentDoc}
  ${TaxForPlanSettingsSectionFragmentDoc}
`

export type PlanDetailsV2UsageChargesSectionRef = {
  openCreate: () => void
}

type Props = {
  plan: PlanForDetailsV2UsageChargesSectionFragment
  isInSubscriptionForm?: boolean
}

type UsageCharge = NonNullable<PlanForDetailsV2UsageChargesSectionFragment['charges']>[number]

const toLocalInput = (
  charge: UsageCharge,
  planCurrency: CurrencyEnum,
  hasAnyPricingUnitConfigured: boolean,
): LocalUsageChargeInput => {
  const minAmountCentsNumber = Number(charge.minAmountCents)
  const hasMinAmount =
    charge.minAmountCents !== null &&
    charge.minAmountCents !== undefined &&
    !isNaN(minAmountCentsNumber) &&
    String(charge.minAmountCents) !== '0'

  return {
    id: charge.id,
    billableMetric: charge.billableMetric as never,
    appliedPricingUnit:
      !hasAnyPricingUnitConfigured && !charge.appliedPricingUnit
        ? undefined
        : {
            code: charge.appliedPricingUnit?.pricingUnit?.code ?? planCurrency,
            conversionRate: String(charge.appliedPricingUnit?.conversionRate ?? ''),
            shortName: charge.appliedPricingUnit?.pricingUnit?.shortName ?? planCurrency,
            type: charge.appliedPricingUnit?.pricingUnit?.code
              ? LocalPricingUnitType.Custom
              : LocalPricingUnitType.Fiat,
          },
    chargeModel: charge.chargeModel,
    invoiceDisplayName: charge.invoiceDisplayName ?? '',
    invoiceable: charge.invoiceable ?? true,
    minAmountCents: hasMinAmount
      ? String(deserializeAmount(charge.minAmountCents ?? 0, planCurrency))
      : '',
    payInAdvance: charge.payInAdvance ?? false,
    prorated: charge.prorated ?? false,
    properties: charge.properties ? getPropertyShape(charge.properties) : undefined,
    filters: (charge.filters ?? []).map((filter) => ({
      invoiceDisplayName: filter.invoiceDisplayName ?? '',
      properties: getPropertyShape(filter.properties),
      values: Object.entries((filter.values as Record<string, string[]>) || {}).reduce<string[]>(
        (acc, [key, objectValues]) => {
          ;(objectValues as string[]).forEach((v) => {
            acc.push(transformFilterObjectToString(key, v))
          })
          return acc
        },
        [],
      ),
    })),
    regroupPaidFees: charge.regroupPaidFees ?? null,
    taxes: charge.taxes as never,
  }
}

export const PlanDetailsV2UsageChargesSection = forwardRef<
  PlanDetailsV2UsageChargesSectionRef,
  Props
>(({ plan, isInSubscriptionForm = false }, ref) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { hasAnyPricingUnitConfigured } = useCustomPricingUnits()
  const drawerRef = useRef<UsageChargeDrawerRef>(null)

  const canCreate = hasPermissions(['plansCreate']) && !isInSubscriptionForm
  const canDelete = hasPermissions(['plansDelete']) && !isInSubscriptionForm

  const { handleSaveCharge, handleDeleteCharge } = useChargeMutationsWithCascade({
    planId: plan.id,
    hasOverriddenPlans: plan.hasOverriddenPlans ?? false,
    currency: plan.amountCurrency as CurrencyEnum,
  })

  const openCreate = () => drawerRef.current?.openDrawer()

  useImperativeHandle(ref, () => ({ openCreate }))

  const openEdit = (charge: LocalUsageChargeInput, index: number) =>
    drawerRef.current?.openDrawer(charge, index)

  const planCurrency = plan.amountCurrency
  const charges = plan.charges ?? []
  const isEmpty = charges.length === 0

  return (
    <section id={PlanDetailsV2SectionId.UsageCharges} className="flex scroll-mt-12 flex-col gap-6">
      <SectionHeader
        title={translate('text_1779289915866ngi8sv5t9lg')}
        action={
          canCreate
            ? {
                label: translate('text_1772133285142oouequiz2t2'),
                onClick: openCreate,
              }
            : undefined
        }
      />

      {isEmpty && (
        <Typography variant="body" color="grey600">
          {translate('text_17797360854699edp5yofy8h')}
        </Typography>
      )}

      {charges.map((charge, index) => (
        <SectionAccordion
          key={charge.id}
          title={charge.invoiceDisplayName || charge.billableMetric.name}
          subtitle={charge.billableMetric.code}
          actions={[
            {
              label: translate('text_63e51ef4985f0ebd75c212fc'),
              onClick: () =>
                openEdit(toLocalInput(charge, planCurrency, hasAnyPricingUnitConfigured), index),
              hidden: isInSubscriptionForm,
            },
            {
              label: translate('text_63ea0f84f400488553caa786'),
              onClick: () => handleDeleteCharge(charge.id),
              hidden: !canDelete,
            },
          ]}
          noContentMargin
        >
          <UsageChargeInfo
            charge={charge as never}
            currency={plan.amountCurrency as CurrencyEnum}
            planInterval={plan.interval as PlanInterval}
            billChargesMonthly={plan.billChargesMonthly}
            planTaxes={plan.taxes as never}
          />
        </SectionAccordion>
      ))}

      <PlanFormProvider
        currency={plan.amountCurrency as CurrencyEnum}
        interval={(plan.interval as PlanInterval) ?? PlanInterval.Monthly}
      >
        <UsageChargeDrawer
          ref={drawerRef}
          isEdition
          isInSubscriptionForm={isInSubscriptionForm}
          amountCurrency={plan.amountCurrency}
          onSave={handleSaveCharge}
          onDelete={(index) => {
            const target = charges[index]
            if (target) handleDeleteCharge(target.id)
          }}
        />
      </PlanFormProvider>
    </section>
  )
})

PlanDetailsV2UsageChargesSection.displayName = 'PlanDetailsV2UsageChargesSection'
