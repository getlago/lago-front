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
import { ProgressiveBillingSection } from '~/components/plans/ProgressiveBillingSection'
import type { LocalUsageChargeInput, PlanFormInput } from '~/components/plans/types'
import { UsageChargesSection } from '~/components/plans/UsageChargesSection'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  type BillingItemPlan,
  DEFAULT_INVOICING_SETTINGS,
  DEFAULT_SUBSCRIPTION_SETTINGS,
  type SubscriptionPricingState,
} from '~/core/serializers/serializeQuotePlanBillingItems'
import { CurrencyEnum, PlanInterval, usePlansLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePlanFormSetup } from '~/hooks/plans/usePlanFormSetup'
import type { QuoteCustomer } from '~/pages/quotes/hooks/useSubscriptionPricingDrawer'

import { QuoteInvoicingPaymentsSettings } from './QuoteInvoicingPaymentsSettings'
import { useQuotePlanSettingsDrawer } from './useQuotePlanSettingsDrawer'
import { useSubscriptionSettingsDrawer } from './useSubscriptionSettingsDrawer'

export type ValidatePlanForm = () => Promise<boolean>

interface SubscriptionPricingContentProps {
  stateRef: MutableRefObject<SubscriptionPricingState | null>
  formValuesRef: MutableRefObject<PlanFormInput | null>
  // Filled with a submit-and-report-validity function so the drawer can refuse to
  // persist an incomplete plan.
  validatePlanFormRef?: MutableRefObject<ValidatePlanForm | null>
  basePlanFormValuesRef: MutableRefObject<PlanFormInput | null>
  initialState?: SubscriptionPricingState | null
  quoteDates?: { startDate?: string; endDate?: string }
  customer?: QuoteCustomer | null
  /** Currency used to display amounts — may be a customer/organization fallback. */
  currency?: CurrencyEnum | null
  /**
   * Whether `currency` is the quote's own currency. When it is, the quote owns
   * the currency and the plan's own picker is locked; when it is not, the plan
   * is free to define it (and will seed the quote currency on save).
   */
  hasQuoteCurrency?: boolean
  billingItemPlan?: BillingItemPlan
  subscriptionId?: string
  /**
   * Subscription-amendment quote: the start date belongs to the amended subscription, so it
   * is never displayed nor seeded here (LAGO-1814).
   */
  isAmendment?: boolean
}

export function SubscriptionPricingContent({
  stateRef,
  formValuesRef,
  validatePlanFormRef,
  basePlanFormValuesRef,
  initialState,
  quoteDates,
  customer,
  currency,
  hasQuoteCurrency,
  billingItemPlan,
  subscriptionId,
  isAmendment = false,
}: Readonly<SubscriptionPricingContentProps>) {
  const { translate } = useInternationalization()

  // Plan selection
  const [selectedPlanId, setSelectedPlanId] = useState(initialState?.planId || '')

  // Lazy + searchable: the ComboBox's debounced searchQuery triggers the initial
  // load on mount and re-queries with a searchTerm as the user types, so plans
  // beyond the first page stay reachable.
  const [getPlans, { data: plansData, loading: plansLoading }] = usePlansLazyQuery({
    variables: { limit: 100 },
  })

  // Track the plan this drawer opened with — either the saved billing item's plan or,
  // on an amendment, the plan resolved from the subscription (recorded by the sync effect
  // below). Once the user picks a *different* plan, stop forwarding both billingItemPlan
  // and subscriptionId so usePlanFormSetup falls back to fetching the newly selected plan
  // and resets prices to its defaults (LAGO-1602, LAGO-1822).
  const originalPlanIdRef = useRef(billingItemPlan?.id)
  const userSwitchedPlan =
    !!originalPlanIdRef.current && !!selectedPlanId && selectedPlanId !== originalPlanIdRef.current

  // Set by the form's own onSubmit, which TanStack only calls once the form-level
  // `planFormSchema` passed — so it doubles as the validity signal.
  const planFormValidRef = useRef(false)

  // Plan form — fetches plan by ID and creates TanStack form (no Router needed)
  const {
    form: planForm,
    plan: planData,
    catalogPlan,
    formReady,
    resolvedPlanId,
    basePlanFormValues,
    subscriptionSettings: billingItemSubscriptionSettings,
    invoicingSettings: billingItemInvoicingSettings,
  } = usePlanFormSetup({
    planIdToFetch: selectedPlanId || undefined,
    // When the quote owns a currency it is the source of truth for every amount
    // here, so the plan form (de)serializes with it. Without one, the plan keeps
    // its own currency and seeds the quote's on save.
    initialCurrency: hasQuoteCurrency ? (currency ?? undefined) : undefined,
    billingItemPlan: userSwitchedPlan ? undefined : billingItemPlan,
    subscriptionId: userSwitchedPlan ? undefined : subscriptionId,
    onSubmit: () => {
      planFormValidRef.current = true
    },
  })

  useEffect(() => {
    if (!validatePlanFormRef) return

    validatePlanFormRef.current = async () => {
      planFormValidRef.current = false
      await planForm.handleSubmit()

      return planFormValidRef.current
    }

    return () => {
      validatePlanFormRef.current = null
    }
  }, [planForm, validatePlanFormRef])

  // Sync selectedPlanId from resolvedPlanId when billing items or subscription data arrives.
  // That first resolution is also the plan the drawer opened with, so record it as the
  // baseline for userSwitchedPlan (the subscription path has no billingItemPlan to seed it).
  useEffect(() => {
    if (resolvedPlanId && !selectedPlanId) {
      originalPlanIdRef.current = resolvedPlanId
      setSelectedPlanId(resolvedPlanId)
    }
  }, [resolvedPlanId, selectedPlanId])

  // Quote-specific state
  const [subscriptionSettings, setSubscriptionSettings] = useState(() => {
    const getInitialSettings = () => {
      if (initialState?.subscriptionSettings) return initialState.subscriptionSettings
      if (billingItemSubscriptionSettings) return billingItemSubscriptionSettings

      return {
        ...DEFAULT_SUBSCRIPTION_SETTINGS,
        startDate: quoteDates?.startDate ?? '',
        endDate: quoteDates?.endDate ?? '',
      }
    }

    const settings = getInitialSettings()

    // An amendment quote never carries a start date, whichever source seeded the settings.
    if (isAmendment) return { ...settings, startDate: '' }

    return settings
  })
  const [invoicingSettings, setInvoicingSettings] = useState(
    initialState?.invoicingSettings ?? billingItemInvoicingSettings ?? DEFAULT_INVOICING_SETTINGS,
  )

  // On an amendment the settings come from the subscription query, which resolves *after*
  // mount — the lazy initializer above has already run with the defaults by then, so seed
  // them once when they land. Skipped when a saved quote state or the user already owns them.
  const subscriptionSettingsSeededRef = useRef(
    !!initialState?.subscriptionSettings || !!billingItemSubscriptionSettings,
  )

  useEffect(() => {
    if (subscriptionSettingsSeededRef.current || !billingItemSubscriptionSettings) return

    subscriptionSettingsSeededRef.current = true
    setSubscriptionSettings(
      // An amendment quote never carries a start date (it belongs to the subscription).
      isAmendment
        ? { ...billingItemSubscriptionSettings, startDate: '' }
        : billingItemSubscriptionSettings,
    )
  }, [billingItemSubscriptionSettings, isAmendment])

  // Hook-based drawers for settings
  const subscriptionSettingsDrawer = useSubscriptionSettingsDrawer((values) => {
    subscriptionSettingsSeededRef.current = true
    setSubscriptionSettings(values)
  }, isAmendment)
  const showInvoicingSection = Boolean(customer?.externalId || customer?.id)
  const planSettingsDrawer = useQuotePlanSettingsDrawer(planForm, {
    disableCurrencyInput: hasQuoteCurrency,
  })

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

  // Watch form values for display and the subscription fee drawer
  const formAmountCents = useStore(planForm.store, (s) => s.values.amountCents)
  const formInvoiceDisplayName = useStore(planForm.store, (s) => s.values.invoiceDisplayName)
  const formPayInAdvance = useStore(planForm.store, (s) => s.values.payInAdvance)
  const formTrialPeriod = useStore(planForm.store, (s) => s.values.trialPeriod)
  const formName = useStore(planForm.store, (s) => s.values.name)
  const formDescription = useStore(planForm.store, (s) => s.values.description)
  const formCode = useStore(planForm.store, (s) => s.values.code)
  const formInterval = useStore(planForm.store, (s) => s.values.interval)
  // Full form values — snapshot into formValuesRef so the serializer can derive
  // both the plan payload and the overrides from a single source of truth.
  const formValues = useStore(planForm.store, (s) => s.values)

  const displayCurrency = currency ?? CurrencyEnum.Usd
  const displayInterval = formInterval || PlanInterval.Monthly

  // Base (original) plan name for the payload. On a fresh selection it comes from the
  // freshly-fetched plan; when editing an existing quote plan the plan query is skipped
  // (planData is undefined), so fall back to the already-stored base name.
  const basePlanName =
    planData?.name ?? billingItemPlan?.payload.name ?? initialState?.basePlanName ?? formName

  // Sync to stateRef + formValuesRef + basePlanFormValuesRef. Overrides are no longer
  // computed here: toPlanBillingItems() derives them from the two form value refs
  // (see buildPlanOverrides).
  useEffect(() => {
    if (!formReady || !selectedPlanId) {
      stateRef.current = null
      return
    }

    stateRef.current = {
      planId: planData?.id ?? selectedPlanId,
      planCode: formCode,
      planName: formName,
      basePlanName,
      planDescription: formDescription ?? '',
      subscriptionSettings,
      invoicingSettings,
    }

    formValuesRef.current = formValues
    basePlanFormValuesRef.current = basePlanFormValues ?? null
  }, [
    formReady,
    planData,
    selectedPlanId,
    subscriptionSettings,
    invoicingSettings,
    formName,
    basePlanName,
    formDescription,
    formCode,
    formValues,
    basePlanFormValues,
    stateRef,
    formValuesRef,
    basePlanFormValuesRef,
  ])

  // ComboBox data
  const comboBoxData = useMemo(() => {
    const data = (plansData?.plans?.collection ?? []).map((p) => ({
      value: p.id,
      label: `${p.name} (${p.code})`,
    }))

    // Ensure the pre-selected plan is always present, even when it falls outside
    // the current (searchable) result page, so its label still renders. It has to be
    // the catalog plan: on an amendment the subscription runs an override child plan,
    // which is not listed on the Plans page and must never be offered here.
    if (catalogPlan && !data.some((d) => d.value === catalogPlan.id)) {
      data.unshift({ value: catalogPlan.id, label: `${catalogPlan.name} (${catalogPlan.code})` })
    }

    return data
  }, [plansData, catalogPlan])

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
            searchQuery={getPlans}
            disabled={!!subscriptionId && !isAmendment}
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

          {/* 3. Invoicing & payments settings */}
          {showInvoicingSection && customer && (
            <QuoteInvoicingPaymentsSettings
              customer={customer}
              value={invoicingSettings}
              onChange={setInvoicingSettings}
            />
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
              isInSubscriptionForm
            />
          </PlanFormProvider>
        </>
      )}
    </CenteredPage.SubsectionWrapper>
  )
}
