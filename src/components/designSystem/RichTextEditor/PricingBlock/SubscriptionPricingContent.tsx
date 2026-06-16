import { useStore } from '@tanstack/react-form'
import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { ComboBox } from '~/components/form/ComboBox/ComboBox'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { CommitmentsSection } from '~/components/plans/CommitmentsSection'
import {
  SubscriptionFeeDrawer,
  type SubscriptionFeeDrawerRef,
  type SubscriptionFeeFormValues,
} from '~/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer'
import { FixedChargesSection } from '~/components/plans/form/FixedChargesSection'
import type { LocalUsageChargeInput, PlanFormInput } from '~/components/plans/types'
import { UsageChargesSection } from '~/components/plans/UsageChargesSection'
import { ProgressiveBillingSection } from '~/components/subscriptions/ProgressiveBillingSection'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  type BillingItemPlan,
  DEFAULT_INVOICING_SETTINGS,
  DEFAULT_SUBSCRIPTION_SETTINGS,
  type PlanOverrides,
  type SubscriptionPricingState,
} from '~/core/serializers/serializeQuotePlanBillingItems'
import { CurrencyEnum, PlanInterval, usePlansQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePlanFormSetup } from '~/hooks/plans/usePlanFormSetup'
import type { QuoteCustomer } from '~/pages/quotes/hooks/useSubscriptionPricingDrawer'

import { useInvoicingPaymentsSettingsDrawer } from './useInvoicingPaymentsSettingsDrawer'
import { useQuotePlanSettingsDrawer } from './useQuotePlanSettingsDrawer'
import { useSubscriptionSettingsDrawer } from './useSubscriptionSettingsDrawer'

interface SubscriptionPricingContentProps {
  stateRef: MutableRefObject<SubscriptionPricingState | null>
  formValuesRef: MutableRefObject<PlanFormInput | null>
  initialState?: SubscriptionPricingState | null
  quoteDates?: { startDate?: string; endDate?: string }
  customer?: QuoteCustomer | null
  billingItemPlan?: BillingItemPlan
  subscriptionId?: string
}

export function SubscriptionPricingContent({
  stateRef,
  formValuesRef,
  initialState,
  quoteDates,
  customer,
  billingItemPlan,
  subscriptionId,
}: SubscriptionPricingContentProps) {
  const { translate } = useInternationalization()

  // Plan selection
  const [selectedPlanId, setSelectedPlanId] = useState(initialState?.planId || '')

  const { data: plansData, loading: plansLoading } = usePlansQuery({
    variables: { limit: 100 },
  })

  // Plan form — fetches plan by ID and creates TanStack form (no Router needed)
  const {
    form: planForm,
    plan: planData,
    formReady,
    resolvedPlanId,
    subscriptionSettings: billingItemSubscriptionSettings,
    invoicingSettings: billingItemInvoicingSettings,
  } = usePlanFormSetup({
    planIdToFetch: selectedPlanId || undefined,
    billingItemPlan,
    subscriptionId,
  })

  // Sync selectedPlanId from resolvedPlanId when billing items or subscription data arrives
  useEffect(() => {
    if (resolvedPlanId && !selectedPlanId) {
      setSelectedPlanId(resolvedPlanId)
    }
  }, [resolvedPlanId, selectedPlanId])

  // Quote-specific state
  const [subscriptionSettings, setSubscriptionSettings] = useState(() => {
    if (initialState?.subscriptionSettings) return initialState.subscriptionSettings
    if (billingItemSubscriptionSettings) return billingItemSubscriptionSettings

    return {
      ...DEFAULT_SUBSCRIPTION_SETTINGS,
      startDate: quoteDates?.startDate ?? '',
      endDate: quoteDates?.endDate ?? '',
    }
  })
  const [invoicingSettings, setInvoicingSettings] = useState(
    initialState?.invoicingSettings ?? billingItemInvoicingSettings ?? DEFAULT_INVOICING_SETTINGS,
  )

  // Hook-based drawers for settings
  const subscriptionSettingsDrawer = useSubscriptionSettingsDrawer(
    (values) => setSubscriptionSettings(values),
    !!subscriptionId,
  )
  const invoicingSettingsDrawer = useInvoicingPaymentsSettingsDrawer(
    (values) => setInvoicingSettings(values),
    customer,
  )
  const showInvoicingSection = invoicingSettingsDrawer.showSection
  const planSettingsDrawer = useQuotePlanSettingsDrawer(planForm)

  // Subscription fee drawer (grouped with plan settings section)
  const subscriptionFeeDrawerRef = useRef<SubscriptionFeeDrawerRef>(null)

  const handleSubscriptionFeeSave = useCallback(
    (values: SubscriptionFeeFormValues) => {
      planForm.setFieldValue('amountCents', values.amountCents)
      planForm.setFieldValue('payInAdvance', values.payInAdvance)
      planForm.setFieldValue('trialPeriod', values.trialPeriod)
      planForm.setFieldValue('invoiceDisplayName', values.invoiceDisplayName)
    },
    [planForm],
  )

  // Watch form values for override computation and display
  const formAmountCents = useStore(planForm.store, (s) => s.values.amountCents)
  const formInvoiceDisplayName = useStore(planForm.store, (s) => s.values.invoiceDisplayName)
  const formPayInAdvance = useStore(planForm.store, (s) => s.values.payInAdvance)
  const formTrialPeriod = useStore(planForm.store, (s) => s.values.trialPeriod)
  const formName = useStore(planForm.store, (s) => s.values.name)
  const formDescription = useStore(planForm.store, (s) => s.values.description)
  const formCode = useStore(planForm.store, (s) => s.values.code)
  const formCurrency = useStore(planForm.store, (s) => s.values.amountCurrency)
  const formInterval = useStore(planForm.store, (s) => s.values.interval)
  const formFixedCharges = useStore(planForm.store, (s) => s.values.fixedCharges)
  const formCharges = useStore(planForm.store, (s) => s.values.charges)
  const formMinimumCommitment = useStore(planForm.store, (s) => s.values.minimumCommitment)
  const formNonRecurringThresholds = useStore(
    planForm.store,
    (s) => s.values.nonRecurringUsageThresholds,
  )
  const formRecurringThreshold = useStore(planForm.store, (s) => s.values.recurringUsageThreshold)

  const displayCurrency = (formCurrency as CurrencyEnum) || CurrencyEnum.Usd
  const displayInterval = formInterval || PlanInterval.Monthly

  // Sync to stateRef — compute overrides from form state vs original plan
  useEffect(() => {
    if (!formReady || !selectedPlanId) {
      stateRef.current = null
      return
    }

    // Always serialize the full form state as overrides — the backend applies them on top of the plan
    const overrides: PlanOverrides = {}

    // Subscription fee
    overrides.amount_cents = Number(formAmountCents) || undefined
    if (formInvoiceDisplayName) {
      overrides.invoice_display_name = formInvoiceDisplayName || undefined
    }

    // Fixed charges
    if (formFixedCharges?.length) {
      overrides.charges = [
        ...formFixedCharges.map((c) => ({
          billable_metric_code: c.addOn?.code ?? '',
          charge_model: c.chargeModel,
          properties: (c.properties ?? {}) as Record<string, unknown>,
        })),
      ]
    }

    // Usage charges
    if (formCharges?.length) {
      overrides.charges = [
        ...(overrides.charges ?? []),
        ...formCharges.map((c) => ({
          billable_metric_code: c.billableMetric?.code ?? '',
          charge_model: c.chargeModel,
          properties: (c.properties ?? {}) as Record<string, unknown>,
        })),
      ]
    }

    // Minimum commitment
    const mcAmount = formMinimumCommitment?.amountCents

    if (mcAmount && !isNaN(Number(mcAmount)) && Number(mcAmount) > 0) {
      overrides.minimum_commitment = {
        amount_cents: Number(mcAmount),
        invoice_display_name: formMinimumCommitment?.invoiceDisplayName || undefined,
      }
    }

    // Progressive billing (usage thresholds)
    const thresholds = [
      ...(formNonRecurringThresholds ?? []).map((t) => ({
        amount_cents: Number(t.amountCents),
        recurring: false as const,
        threshold_display_name: t.thresholdDisplayName ?? undefined,
      })),
      ...(formRecurringThreshold
        ? [
            {
              amount_cents: Number(formRecurringThreshold.amountCents),
              recurring: true as const,
              threshold_display_name: formRecurringThreshold.thresholdDisplayName ?? undefined,
            },
          ]
        : []),
    ]

    if (thresholds.length) {
      overrides.usage_thresholds = thresholds
    }

    stateRef.current = {
      planId: planData?.id ?? selectedPlanId,
      planCode: formCode,
      planName: formName,
      planDescription: formDescription ?? '',
      subscriptionSettings,
      invoicingSettings,
      overrides,
    }

    formValuesRef.current = planForm.state.values
  }, [
    formReady,
    planData,
    selectedPlanId,
    subscriptionSettings,
    invoicingSettings,
    formAmountCents,
    formInvoiceDisplayName,
    formName,
    formDescription,
    formCode,
    formFixedCharges,
    formCharges,
    formMinimumCommitment,
    formNonRecurringThresholds,
    formRecurringThreshold,
    stateRef,
    formValuesRef,
    planForm,
  ])

  // ComboBox data
  const comboBoxData = useMemo(() => {
    const plans = plansData?.plans?.collection ?? []

    return plans.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.code})`,
    }))
  }, [plansData])

  // Shared selector helpers for custom sections
  const buildEndContent = (showInterval = false) => (
    <div className="flex items-center gap-3">
      {showInterval && <Chip label={translate(getIntervalTranslationKey[displayInterval])} />}
      <Tooltip placement="top-end" title={translate('text_17719630334671lxunwzo7ae')}>
        <Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />
      </Tooltip>
    </div>
  )

  const buildHoverActions = (onEdit: () => void) => (
    <SelectorActions
      actions={[
        {
          icon: 'pen',
          tooltipCopy: translate('text_63e51ef4985f0ebd75c212fc'),
          onClick: (e) => {
            e.stopPropagation()
            onEdit()
          },
        },
      ]}
    />
  )

  // Drawer open handlers
  const openSubscriptionSettings = () => subscriptionSettingsDrawer.openDrawer(subscriptionSettings)

  const openInvoicingSettings = () => invoicingSettingsDrawer.openDrawer(invoicingSettings)

  const openPlanSettings = () => planSettingsDrawer.openDrawer()

  const openSubscriptionFeeDrawer = () =>
    subscriptionFeeDrawerRef.current?.openDrawer({
      amountCents: formAmountCents || '',
      payInAdvance: formPayInAdvance || false,
      trialPeriod: formTrialPeriod ?? 0,
      invoiceDisplayName: formInvoiceDisplayName || undefined,
    })

  const formattedFee = intlFormatNumber(Number(formAmountCents || 0), {
    style: 'currency',
    currency: displayCurrency,
  })

  return (
    <CenteredPage.SubsectionWrapper>
      {/* 1. Plan selection */}
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-1">
          <Typography variant="headline">{translate('text_17791987800302plb0guzxzv')}</Typography>
          <Typography variant="body" color="grey600">
            {translate('text_1781191156548mkw3alklhhh')}
          </Typography>
        </div>
        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_65118a52df984447c186940f', {
              customerName: customer?.name,
            })}
            description={translate('text_1781099100337s3ou7wd0l4z')}
          />
          <ComboBox
            data={comboBoxData}
            loading={plansLoading}
            disabled={!!subscriptionId}
            label={translate('text_17810991003371jgudmuzk6a')}
            placeholder={translate('text_1781099100337xeyy7omuzp8')}
            value={selectedPlanId}
            onChange={(value) => {
              if (value) setSelectedPlanId(value)
            }}
          />
        </CenteredPage.PageSection>
      </div>

      {!!selectedPlanId && formReady && (
        <>
          {/* 2. Subscription settings */}
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_17791987800304a3fihrighy')}
              description={translate('text_17810991003377o8vcthggta')}
            />
            <Selector
              icon="settings"
              title={translate('text_17791987800304a3fihrighy')}
              endContent={buildEndContent()}
              hoverActions={buildHoverActions(openSubscriptionSettings)}
              onClick={openSubscriptionSettings}
            />
          </CenteredPage.PageSection>

          {/* 3. Invoicing & payments settings (feature-flagged) */}
          {showInvoicingSection && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle
                title={translate('text_17791987800309g2j0x3t2n0')}
                description={translate('text_1781099100337xfqzt0jxvj5')}
              />
              <Selector
                icon="receipt"
                title={translate('text_17791987800309g2j0x3t2n0')}
                endContent={buildEndContent()}
                hoverActions={buildHoverActions(openInvoicingSettings)}
                onClick={openInvoicingSettings}
              />
            </CenteredPage.PageSection>
          )}

          {/* 4. Plan settings + Subscription fee */}
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_177928991586601f21f0x87c')}
              description={translate('text_1781099100338qnx3kgjyv14')}
            />
            <Selector
              icon="board"
              title={translate('text_177928991586601f21f0x87c')}
              endContent={buildEndContent()}
              hoverActions={buildHoverActions(openPlanSettings)}
              onClick={openPlanSettings}
            />
            <Selector
              icon="coin-dollar"
              title={formInvoiceDisplayName || translate('text_1779289915866etwoweh1syv')}
              subtitle={formattedFee}
              endContent={buildEndContent(true)}
              hoverActions={buildHoverActions(openSubscriptionFeeDrawer)}
              onClick={openSubscriptionFeeDrawer}
            />
          </CenteredPage.PageSection>

          {/* 5-9. Reused plan form sections */}
          <PlanFormProvider currency={displayCurrency} interval={displayInterval}>
            <FixedChargesSection
              form={planForm}
              alreadyExistingFixedChargesIds={planData?.fixedCharges?.map((c) => c.id) || []}
              isInSubscriptionForm
              isEdition={false}
            />

            <UsageChargesSection
              form={planForm}
              alreadyExistingCharges={(planData?.charges ?? []) as LocalUsageChargeInput[]}
              isInSubscriptionForm
              isEdition={false}
            />

            <CommitmentsSection form={planForm} />

            <ProgressiveBillingSection form={planForm} />

            <SubscriptionFeeDrawer
              ref={subscriptionFeeDrawerRef}
              onSave={handleSubscriptionFeeSave}
            />
          </PlanFormProvider>
        </>
      )}
    </CenteredPage.SubsectionWrapper>
  )
}
