import type {
  LocalFixedChargeInput,
  LocalUsageChargeInput,
  PlanFormInput,
} from '~/components/plans/types'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CommitmentTypeEnum,
  CurrencyEnum,
  FixedChargeChargeModelEnum,
  PlanInterval,
} from '~/generated/graphql'

import {
  type BillingItemPlan,
  DEFAULT_INVOICING_SETTINGS,
  DEFAULT_SUBSCRIPTION_SETTINGS,
  fromPlanBillingItems,
  type SubscriptionPricingState,
  toPlanBillingItems,
} from '../serializeQuotePlanBillingItems'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const basePricingState: SubscriptionPricingState = {
  planId: 'plan_123',
  planCode: 'enterprise',
  planName: 'Enterprise Plan',
  planDescription: 'Custom enterprise offering',
  subscriptionSettings: {
    ...DEFAULT_SUBSCRIPTION_SETTINGS,
    billingTime: 'anniversary',
    startDate: '2023-07-26',
  },
  invoicingSettings: DEFAULT_INVOICING_SETTINGS,
  overrides: {},
}

const baseFormValues: PlanFormInput = {
  name: 'Enterprise Plan',
  code: 'enterprise',
  description: 'Custom enterprise offering',
  interval: PlanInterval.Monthly,
  amountCents: '850.00',
  amountCurrency: CurrencyEnum.Usd,
  payInAdvance: false,
  billChargesMonthly: null,
  billFixedChargesMonthly: null,
  trialPeriod: 0,
  invoiceDisplayName: undefined,
  charges: [],
  fixedCharges: [],
  entitlements: [],
}

const baseBillingItemPlan: BillingItemPlan = {
  type: 'plan',
  id: 'plan_123',
  payload: {
    position: 1,
    plan_code: 'enterprise',
    plan_name: 'Enterprise Plan',
    plan_description: 'Custom enterprise offering',
    subscription_external_id: null,
    subscription_name: null,
    billing_time: 'anniversary',
    start_date: '2023-07-26',
    end_date: null,
    payment_method_id: null,
    invoice_custom_footer: null,
  },
  overrides: {},
}

// ---------------------------------------------------------------------------
// toPlanBillingItems — existing tests (updated for new signature)
// ---------------------------------------------------------------------------

describe('toPlanBillingItems', () => {
  it('serializes a basic plan with no overrides', () => {
    const result = toPlanBillingItems(basePricingState, baseFormValues)

    expect(result.plans[0].type).toBe('plan')
    expect(result.plans[0].id).toBe('plan_123')
    expect(result.plans[0].payload.position).toBe(1)
    expect(result.plans[0].payload.plan_code).toBe('enterprise')
    expect(result.plans[0].payload.plan_name).toBe('Enterprise Plan')
    expect(result.plans[0].payload.plan_description).toBe('Custom enterprise offering')
    expect(result.plans[0].payload.billing_time).toBe('anniversary')
    expect(result.plans[0].payload.subscription_external_id).toBeNull()
    expect(result.plans[0].payload.subscription_name).toBeNull()
    expect(result.plans[0].payload.end_date).toBeNull()
    expect(result.plans[0].payload.payment_method_id).toBeNull()
    expect(result.plans[0].payload.invoice_custom_footer).toBeNull()
    // New plan config fields from formValues
    expect(result.plans[0].payload.interval).toBe(PlanInterval.Monthly)
    expect(result.plans[0].payload.amount_cents).toBe('850.00')
    expect(result.plans[0].payload.amount_currency).toBe(CurrencyEnum.Usd)
    expect(result.plans[0].payload.charges).toEqual([])
    expect(result.plans[0].overrides).toEqual({})
  })

  it('includes subscription settings in the payload', () => {
    const state: SubscriptionPricingState = {
      ...basePricingState,
      subscriptionSettings: {
        externalId: 'ext_001',
        subscriptionName: 'My Subscription',
        billingTime: 'calendar',
        startDate: '2023-07-26',
        endDate: '2024-07-26',
      },
    }
    const result = toPlanBillingItems(state, baseFormValues)

    expect(result.plans[0].payload.subscription_external_id).toBe('ext_001')
    expect(result.plans[0].payload.subscription_name).toBe('My Subscription')
    expect(result.plans[0].payload.billing_time).toBe('calendar')
    expect(result.plans[0].payload.end_date).toBe('2024-07-26')
  })

  it('includes invoicing settings in the payload', () => {
    const state: SubscriptionPricingState = {
      ...basePricingState,
      invoicingSettings: {
        paymentMethodId: 'pm_456',
        invoiceCustomFooter: 'Custom footer text',
      },
    }
    const result = toPlanBillingItems(state, baseFormValues)

    expect(result.plans[0].payload.payment_method_id).toBe('pm_456')
    expect(result.plans[0].payload.invoice_custom_footer).toBe('Custom footer text')
  })

  it('includes overrides when provided', () => {
    const state: SubscriptionPricingState = {
      ...basePricingState,
      overrides: {
        amount_cents: 85000,
        minimum_commitment: { amount_cents: 80000 },
        charges: [
          {
            billable_metric_code: 'cpu',
            charge_model: 'graduated',
            properties: { graduated_ranges: [] },
          },
        ],
      },
    }
    const result = toPlanBillingItems(state, baseFormValues)

    expect(result.plans[0].overrides).toEqual({
      amount_cents: 85000,
      minimum_commitment: { amount_cents: 80000 },
      charges: [
        {
          billable_metric_code: 'cpu',
          charge_model: 'graduated',
          properties: { graduated_ranges: [] },
        },
      ],
    })
  })

  it('converts empty strings to null for optional payload fields', () => {
    const result = toPlanBillingItems(basePricingState, baseFormValues)

    expect(result.plans[0].payload.subscription_external_id).toBeNull()
    expect(result.plans[0].payload.subscription_name).toBeNull()
    expect(result.plans[0].payload.end_date).toBeNull()
    expect(result.plans[0].payload.payment_method_id).toBeNull()
    expect(result.plans[0].payload.invoice_custom_footer).toBeNull()
  })

  it('omits plan config fields when formValues is not provided', () => {
    const result = toPlanBillingItems(basePricingState)

    expect(result.plans[0].payload.interval).toBeUndefined()
    expect(result.plans[0].payload.charges).toBeUndefined()
    expect(result.plans[0].payload.fixed_charges).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// fromPlanBillingItems — existing tests
// ---------------------------------------------------------------------------

describe('fromPlanBillingItems', () => {
  it('deserializes a plan with no overrides', () => {
    const result = fromPlanBillingItems([baseBillingItemPlan])

    expect(result.planId).toBe('plan_123')
    expect(result.planCode).toBe('enterprise')
    expect(result.planName).toBe('Enterprise Plan')
    expect(result.planDescription).toBe('Custom enterprise offering')
    expect(result.overrides).toEqual({})
  })

  it('deserializes subscription settings from payload', () => {
    const plan: BillingItemPlan = {
      ...baseBillingItemPlan,
      payload: {
        ...baseBillingItemPlan.payload,
        subscription_external_id: 'ext_001',
        subscription_name: 'My Sub',
        billing_time: 'calendar',
        start_date: '2023-07-26',
        end_date: '2024-07-26',
      },
    }
    const result = fromPlanBillingItems([plan])

    expect(result.subscriptionSettings).toEqual({
      externalId: 'ext_001',
      subscriptionName: 'My Sub',
      billingTime: 'calendar',
      startDate: '2023-07-26',
      endDate: '2024-07-26',
    })
  })

  it('deserializes invoicing settings from payload', () => {
    const plan: BillingItemPlan = {
      ...baseBillingItemPlan,
      payload: {
        ...baseBillingItemPlan.payload,
        payment_method_id: 'pm_456',
        invoice_custom_footer: 'Footer text',
      },
    }
    const result = fromPlanBillingItems([plan])

    expect(result.invoicingSettings).toEqual({
      paymentMethodId: 'pm_456',
      invoiceCustomFooter: 'Footer text',
    })
  })

  it('preserves overrides from the billing item', () => {
    const plan: BillingItemPlan = {
      ...baseBillingItemPlan,
      overrides: {
        amount_cents: 85000,
        charges: [
          {
            billable_metric_code: 'cpu',
            charge_model: 'graduated',
            properties: { graduated_ranges: [] },
          },
        ],
      },
    }
    const result = fromPlanBillingItems([plan])

    expect(result.overrides.amount_cents).toBe(85000)
    expect(result.overrides.charges).toHaveLength(1)
  })

  it('builds entity data for the plan', () => {
    const result = fromPlanBillingItems([baseBillingItemPlan])

    expect(result.entityData).toEqual({
      plan_123: {
        entityId: 'plan_123',
        entityType: 'plan',
        name: 'Enterprise Plan',
        code: 'enterprise',
      },
    })
  })

  it('converts null payload fields to empty strings', () => {
    const result = fromPlanBillingItems([baseBillingItemPlan])

    expect(result.subscriptionSettings.externalId).toBe('')
    expect(result.subscriptionSettings.subscriptionName).toBe('')
    expect(result.subscriptionSettings.endDate).toBe('')
    expect(result.invoicingSettings.paymentMethodId).toBe('')
    expect(result.invoicingSettings.invoiceCustomFooter).toBe('')
  })

  it('returns null formValues for legacy payloads without interval/charges', () => {
    const result = fromPlanBillingItems([baseBillingItemPlan])

    expect(result.formValues).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Round-trip tests: toPlanBillingItems → fromPlanBillingItems
// ---------------------------------------------------------------------------

describe('round-trip: toPlanBillingItems → fromPlanBillingItems', () => {
  it('round-trips plan config and usage charges', () => {
    const charge: LocalUsageChargeInput = {
      id: 'charge_001',
      billableMetric: {
        id: 'bm_001',
        code: 'cpu_usage',
        name: 'CPU Usage',
        aggregationType: AggregationTypeEnum.CountAgg,
        recurring: false,
        filters: [{ id: 'filter_001', key: 'region', values: ['us-east-1', 'eu-west-1'] }],
      } as LocalUsageChargeInput['billableMetric'],
      chargeModel: ChargeModelEnum.Standard,
      properties: { amount: '0.005' } as LocalUsageChargeInput['properties'],
      invoiceDisplayName: 'CPU Compute',
      payInAdvance: false,
      prorated: false,
      invoiceable: true,
      taxCodes: [],
    }

    const formValues: PlanFormInput = {
      ...baseFormValues,
      charges: [charge],
    }

    const serialized = toPlanBillingItems(basePricingState, formValues)
    const deserialized = fromPlanBillingItems(serialized.plans)

    expect(deserialized.planId).toBe('plan_123')
    expect(deserialized.formValues).not.toBeNull()
    expect(deserialized.formValues?.interval).toBe(PlanInterval.Monthly)
    expect(deserialized.formValues?.amountCents).toBe('850.00')
    expect(deserialized.formValues?.amountCurrency).toBe(CurrencyEnum.Usd)
    expect(deserialized.formValues?.charges).toHaveLength(1)

    const roundTrippedCharge = deserialized.formValues?.charges[0]

    expect(roundTrippedCharge?.billableMetric.code).toBe('cpu_usage')
    expect(roundTrippedCharge?.billableMetric.aggregationType).toBe(AggregationTypeEnum.CountAgg)
    expect(roundTrippedCharge?.chargeModel).toBe(ChargeModelEnum.Standard)
    expect((roundTrippedCharge?.properties as { amount?: string })?.amount).toBe('0.005')
    expect(roundTrippedCharge?.invoiceDisplayName).toBe('CPU Compute')
    expect(roundTrippedCharge?.billableMetric.filters).toHaveLength(1)
    expect(roundTrippedCharge?.billableMetric.filters?.[0]?.key).toBe('region')
  })

  it('round-trips fixed charges and minimum commitment', () => {
    const fixedCharge: LocalFixedChargeInput = {
      id: 'fc_001',
      addOn: {
        id: 'addon_001',
        name: 'Premium Support',
        code: 'premium_support',
      } as LocalFixedChargeInput['addOn'],
      chargeModel: FixedChargeChargeModelEnum.Standard,
      units: '1',
      applyUnitsImmediately: false,
      invoiceDisplayName: 'Support Package',
      payInAdvance: true,
      prorated: false,
      properties: { amount: '500' } as LocalFixedChargeInput['properties'],
      taxCodes: [],
    }

    const formValues: PlanFormInput = {
      ...baseFormValues,
      fixedCharges: [fixedCharge],
      minimumCommitment: {
        amountCents: '100000',
        invoiceDisplayName: 'Annual Minimum',
        commitmentType: CommitmentTypeEnum.MinimumCommitment,
      },
    }

    const serialized = toPlanBillingItems(basePricingState, formValues)
    const deserialized = fromPlanBillingItems(serialized.plans)

    expect(deserialized.formValues).not.toBeNull()
    const fv = deserialized.formValues as PlanFormInput

    // Fixed charges round-trip
    expect(fv.fixedCharges).toHaveLength(1)
    const rtFixedCharge = fv.fixedCharges[0]

    expect(rtFixedCharge.addOn.code).toBe('premium_support')
    expect(rtFixedCharge.addOn.name).toBe('Premium Support')
    expect(rtFixedCharge.units).toBe('1')
    expect(rtFixedCharge.invoiceDisplayName).toBe('Support Package')

    // Minimum commitment round-trip
    expect(fv.minimumCommitment).toBeDefined()
    expect(fv.minimumCommitment?.amountCents).toBe('100000')
    expect(fv.minimumCommitment?.invoiceDisplayName).toBe('Annual Minimum')
  })

  it('round-trips usage thresholds (progressive billing)', () => {
    const formValues: PlanFormInput = {
      ...baseFormValues,
      nonRecurringUsageThresholds: [
        { amountCents: 10000, thresholdDisplayName: 'Tier 1', recurring: false },
        { amountCents: 50000, thresholdDisplayName: 'Tier 2', recurring: false },
      ],
      recurringUsageThreshold: {
        amountCents: 100000,
        thresholdDisplayName: 'Monthly Cap',
        recurring: true,
      },
    }

    const serialized = toPlanBillingItems(basePricingState, formValues)
    const deserialized = fromPlanBillingItems(serialized.plans)

    expect(deserialized.formValues).not.toBeNull()
    const fv = deserialized.formValues as PlanFormInput

    const thresholds = fv.nonRecurringUsageThresholds ?? []

    expect(thresholds).toHaveLength(2)
    expect(thresholds[0].amountCents).toBe(10000)
    expect(thresholds[0].thresholdDisplayName).toBe('Tier 1')
    expect(thresholds[0].recurring).toBe(false)
    expect(thresholds[1].amountCents).toBe(50000)

    const recurring = fv.recurringUsageThreshold

    expect(recurring?.amountCents).toBe(100000)
    expect(recurring?.thresholdDisplayName).toBe('Monthly Cap')
    expect(recurring?.recurring).toBe(true)
  })

  it('backward compat: legacy payload without interval/charges returns null formValues', () => {
    // Simulate a payload that was serialized before the plan form data was added
    const legacyPlan: BillingItemPlan = {
      type: 'plan',
      id: 'plan_legacy',
      payload: {
        position: 1,
        plan_code: 'legacy',
        plan_name: 'Legacy Plan',
        plan_description: 'Old plan',
        subscription_external_id: 'ext_old',
        subscription_name: null,
        billing_time: 'calendar',
        start_date: '2022-01-01',
        end_date: null,
        payment_method_id: null,
        invoice_custom_footer: null,
        // NOTE: no interval, no charges — legacy payload
      },
      overrides: { amount_cents: 75000 },
    }

    const result = fromPlanBillingItems([legacyPlan])

    // formValues must be null — no reconstruction possible from legacy payload
    expect(result.formValues).toBeNull()

    // But core fields still work
    expect(result.planId).toBe('plan_legacy')
    expect(result.planCode).toBe('legacy')
    expect(result.subscriptionSettings.externalId).toBe('ext_old')
    expect(result.subscriptionSettings.billingTime).toBe('calendar')
    expect(result.overrides.amount_cents).toBe(75000)
  })
})
