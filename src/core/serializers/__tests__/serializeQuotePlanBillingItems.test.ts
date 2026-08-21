import type {
  LocalFixedChargeInput,
  LocalUsageChargeInput,
  PlanFormInput,
} from '~/components/plans/types'
import { planFormSchema } from '~/formValidation/planFormSchema'
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
  buildPlanOverrides,
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
  basePlanName: 'Enterprise Plan',
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
    code: 'enterprise',
    name: 'Enterprise Plan',
    description: 'Custom enterprise offering',
    subscriptionExternalId: null,
    subscriptionName: null,
    billingTime: 'anniversary',
    startDate: '2023-07-26',
    endDate: null,
    paymentMethodId: null,
    invoiceCustomFooter: null,
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
    expect(result.plans[0].payload.code).toBe('enterprise')
    expect(result.plans[0].payload.name).toBe('Enterprise Plan')
    expect(result.plans[0].payload.description).toBe('Custom enterprise offering')
    expect(result.plans[0].payload.billingTime).toBe('anniversary')
    expect(result.plans[0].payload.subscriptionExternalId).toBeNull()
    expect(result.plans[0].payload.subscriptionName).toBeNull()
    expect(result.plans[0].payload.endDate).toBeNull()
    expect(result.plans[0].payload.paymentMethodId).toBeNull()
    expect(result.plans[0].payload.invoiceCustomFooter).toBeNull()
    // New plan config fields from formValues
    expect(result.plans[0].payload.interval).toBe(PlanInterval.Monthly)
    // $850.00 (form units) is serialized to cents for the payload/overrides.
    expect(result.plans[0].payload.amountCents).toBe('85000')
    expect(result.plans[0].payload.amountCurrency).toBe(CurrencyEnum.Usd)
    expect(result.plans[0].payload.charges).toEqual([])
    // Overrides are derived from the form values: the subscription fee amount is
    // always carried over (no charges/commitment/thresholds in baseFormValues).
    expect(result.plans[0].overrides).toEqual({ amountCents: 85000 })
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

    expect(result.plans[0].payload.subscriptionExternalId).toBe('ext_001')
    expect(result.plans[0].payload.subscriptionName).toBe('My Subscription')
    expect(result.plans[0].payload.billingTime).toBe('calendar')
    expect(result.plans[0].payload.endDate).toBe('2024-07-26')
  })

  it('omits the startDate key entirely when omitStartDate is set', () => {
    const result = toPlanBillingItems(basePricingState, baseFormValues, undefined, {
      omitStartDate: true,
    })

    expect(result.plans[0].payload).not.toHaveProperty('startDate')
    expect(result.plans[0].payload.endDate).toBeNull()
  })

  it('keeps the startDate key when omitStartDate is not set', () => {
    const result = toPlanBillingItems(basePricingState, baseFormValues)

    expect(result.plans[0].payload.startDate).toBe('2023-07-26')
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

    expect(result.plans[0].payload.paymentMethodId).toBe('pm_456')
    expect(result.plans[0].payload.invoiceCustomFooter).toBe('Custom footer text')
  })

  it('derives overrides from the form values (single source of truth)', () => {
    const formValues: PlanFormInput = {
      ...baseFormValues,
      amountCents: '850.00',
      minimumCommitment: {
        amountCents: '80000',
        commitmentType: CommitmentTypeEnum.MinimumCommitment,
      },
    }
    const result = toPlanBillingItems(basePricingState, formValues)

    // Form amounts ($850.00 fee, $80,000 commitment) are serialized to cents.
    expect(result.plans[0].overrides).toEqual({
      amountCents: 85000,
      minimumCommitment: { amountCents: 8000000, invoiceDisplayName: undefined },
    })
  })

  it('keeps the base name in payload.name and sends the renamed plan in overrides.name', () => {
    const formValues: PlanFormInput = {
      ...baseFormValues,
      name: 'Enterprise Plan - Acme',
    }
    const result = toPlanBillingItems(basePricingState, formValues)

    // Base (original) name stays in the payload; the override lives in overrides.
    expect(result.plans[0].payload.name).toBe('Enterprise Plan')
    expect(result.plans[0].overrides.name).toBe('Enterprise Plan - Acme')
  })

  it('does not send overrides.name when the plan name is unchanged', () => {
    const result = toPlanBillingItems(basePricingState, baseFormValues)

    expect(result.plans[0].payload.name).toBe('Enterprise Plan')
    expect(result.plans[0].overrides.name).toBeUndefined()
  })

  it('falls back to state.overrides when no form values are provided', () => {
    const state: SubscriptionPricingState = {
      ...basePricingState,
      overrides: { amountCents: 85000 },
    }
    const result = toPlanBillingItems(state)

    expect(result.plans[0].overrides).toEqual({ amountCents: 85000 })
  })

  it('converts empty strings to null for optional payload fields', () => {
    const result = toPlanBillingItems(basePricingState, baseFormValues)

    expect(result.plans[0].payload.subscriptionExternalId).toBeNull()
    expect(result.plans[0].payload.subscriptionName).toBeNull()
    expect(result.plans[0].payload.endDate).toBeNull()
    expect(result.plans[0].payload.paymentMethodId).toBeNull()
    expect(result.plans[0].payload.invoiceCustomFooter).toBeNull()
  })

  it('omits plan config fields when formValues is not provided', () => {
    const result = toPlanBillingItems(basePricingState)

    expect(result.plans[0].payload.interval).toBeUndefined()
    expect(result.plans[0].payload.charges).toBeUndefined()
    expect(result.plans[0].payload.fixedCharges).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// buildPlanOverrides — form state → overrides mapping (single source of truth)
// ---------------------------------------------------------------------------

describe('plan currency round trip', () => {
  const catalogUsd = { ...baseFormValues, amountCurrency: CurrencyEnum.Usd }
  const dealEur = { ...baseFormValues, amountCurrency: CurrencyEnum.Eur }

  it('keeps the catalog currency in the payload and the deal currency in the override', () => {
    const result = toPlanBillingItems(basePricingState, dealEur, catalogUsd)

    expect(result.plans[0].payload.amountCurrency).toBe(CurrencyEnum.Usd)
    expect(result.plans[0].overrides.amountCurrency).toBe(CurrencyEnum.Eur)
  })

  it('names the same currency on both sides when there is no repricing', () => {
    const result = toPlanBillingItems(basePricingState, catalogUsd, catalogUsd)

    expect(result.plans[0].payload.amountCurrency).toBe(CurrencyEnum.Usd)
    expect(result.plans[0].overrides).not.toHaveProperty('amountCurrency')
  })

  it('reopens a repriced plan in the deal currency, not the catalog one', () => {
    const serialized = toPlanBillingItems(basePricingState, dealEur, catalogUsd)
    const deserialized = fromPlanBillingItems(serialized.plans)

    expect(deserialized.formValues?.amountCurrency).toBe(CurrencyEnum.Eur)
  })

  it('reads the stored amount back unchanged after a repricing', () => {
    const serialized = toPlanBillingItems(
      basePricingState,
      { ...dealEur, amountCents: '850.00' as PlanFormInput['amountCents'] },
      catalogUsd,
    )
    const deserialized = fromPlanBillingItems(serialized.plans)

    expect(deserialized.formValues?.amountCents).toBe('850')
  })

  it('survives a zero-decimal deal currency, where cents and units are the same number', () => {
    const serialized = toPlanBillingItems(
      basePricingState,
      {
        ...baseFormValues,
        amountCurrency: CurrencyEnum.Jpy,
        amountCents: '850' as PlanFormInput['amountCents'],
      },
      catalogUsd,
    )

    expect(serialized.plans[0].payload.amountCents).toBe('850')
    expect(fromPlanBillingItems(serialized.plans).formValues?.amountCents).toBe('850')
  })
})

describe('buildPlanOverrides', () => {
  it('carries over the subscription fee amount', () => {
    const result = buildPlanOverrides({ ...baseFormValues, amountCents: '850.00' })

    // $850.00 → 85000 cents
    expect(result.amountCents).toBe(85000)
  })

  describe('repricing the deal in another currency', () => {
    it('sends the currency when the deal is priced differently from the catalog plan', () => {
      const result = buildPlanOverrides(
        { ...baseFormValues, amountCurrency: CurrencyEnum.Eur },
        { ...baseFormValues, amountCurrency: CurrencyEnum.Usd },
      )

      expect(result.amountCurrency).toBe(CurrencyEnum.Eur)
    })

    it('stays silent when the deal is in the catalog plan currency', () => {
      const result = buildPlanOverrides(
        { ...baseFormValues, amountCurrency: CurrencyEnum.Usd },
        { ...baseFormValues, amountCurrency: CurrencyEnum.Usd },
      )

      expect(result).not.toHaveProperty('amountCurrency')
    })

    it('does not turn an untouched plan into an override', () => {
      const untouched = { ...baseFormValues, amountCents: '0' as PlanFormInput['amountCents'] }

      expect(buildPlanOverrides(untouched, untouched)).toEqual({})
    })

    it('sends nothing without a baseline, having no way to tell a repricing from the plan price', () => {
      const result = buildPlanOverrides({ ...baseFormValues, amountCurrency: CurrencyEnum.Eur })

      expect(result).not.toHaveProperty('amountCurrency')
    })
  })

  it('omits amountCents when the fee is zero or empty', () => {
    expect(buildPlanOverrides({ ...baseFormValues, amountCents: '0' })).toEqual({})
    expect(buildPlanOverrides({ ...baseFormValues, amountCents: '' })).toEqual({})
  })

  it('includes the invoice display name when present', () => {
    const result = buildPlanOverrides({
      ...baseFormValues,
      amountCents: '0',
      invoiceDisplayName: 'Platform fee',
    })

    expect(result.invoiceDisplayName).toBe('Platform fee')
  })

  describe('GIVEN a plan carrying both fixed charges and usage charges', () => {
    const fixedCharge = {
      addOn: { code: 'setup_fee' },
      chargeModel: FixedChargeChargeModelEnum.Standard,
      units: '5',
      properties: { amount: '100' },
    } as unknown as PlanFormInput['fixedCharges'][number]
    const usageCharge = {
      billableMetric: { code: 'api_calls' },
      chargeModel: ChargeModelEnum.Standard,
      properties: { amount: '0.01' },
    } as unknown as PlanFormInput['charges'][number]

    const buildBoth = () =>
      buildPlanOverrides({
        ...baseFormValues,
        amountCents: '0',
        fixedCharges: [fixedCharge],
        charges: [usageCharge],
      })

    describe('WHEN the overrides are built', () => {
      it('THEN should send the fixed charge under overrides.fixedCharges keyed by addOnCode', () => {
        const result = buildBoth()

        expect(result.fixedCharges).toEqual([
          { addOnCode: 'setup_fee', units: '5', properties: { amount: '100' } },
        ])
      })

      it('THEN should keep overrides.charges limited to usage charges', () => {
        const result = buildBoth()

        expect(result.charges).toEqual([
          {
            billableMetricCode: 'api_calls',
            chargeModel: ChargeModelEnum.Standard,
            properties: { amount: '0.01' },
          },
        ])
      })

      it('THEN should not send chargeModel on a fixed charge override', () => {
        const result = buildBoth()

        expect(result.fixedCharges?.[0]).not.toHaveProperty('chargeModel')
      })
    })
  })

  describe('GIVEN a fixed charge with empty optional values', () => {
    describe('WHEN the overrides are built', () => {
      it.each([
        ['empty string units', ''],
        ['null units', null],
        ['undefined units', undefined],
      ])('THEN should omit units for %s', (_, units) => {
        const result = buildPlanOverrides({
          ...baseFormValues,
          amountCents: '0',
          fixedCharges: [
            {
              addOn: { code: 'setup_fee' },
              chargeModel: FixedChargeChargeModelEnum.Standard,
              units,
              properties: { amount: '100' },
            } as unknown as PlanFormInput['fixedCharges'][number],
          ],
        })

        expect(result.fixedCharges?.[0]).not.toHaveProperty('units')
      })

      it('THEN should omit an empty invoiceDisplayName and absent properties', () => {
        const result = buildPlanOverrides({
          ...baseFormValues,
          amountCents: '0',
          fixedCharges: [
            {
              addOn: { code: 'setup_fee' },
              chargeModel: FixedChargeChargeModelEnum.Standard,
              units: '2',
              invoiceDisplayName: '',
            } as unknown as PlanFormInput['fixedCharges'][number],
          ],
        })

        expect(result.fixedCharges).toEqual([{ addOnCode: 'setup_fee', units: '2' }])
      })

      it('THEN should keep a filled invoiceDisplayName', () => {
        const result = buildPlanOverrides({
          ...baseFormValues,
          amountCents: '0',
          fixedCharges: [
            {
              addOn: { code: 'setup_fee' },
              chargeModel: FixedChargeChargeModelEnum.Standard,
              units: '2',
              invoiceDisplayName: 'Onboarding',
            } as unknown as PlanFormInput['fixedCharges'][number],
          ],
        })

        expect(result.fixedCharges?.[0].invoiceDisplayName).toBe('Onboarding')
      })
    })
  })

  describe('GIVEN a plan without fixed charges', () => {
    describe('WHEN the overrides are built', () => {
      it('THEN should not add a fixedCharges key at all', () => {
        const result = buildPlanOverrides({
          ...baseFormValues,
          amountCents: '0',
          fixedCharges: [],
          charges: [],
        })

        expect(result).not.toHaveProperty('fixedCharges')
        expect(result).not.toHaveProperty('charges')
      })
    })
  })

  it('includes a positive minimum commitment and ignores non-positive ones', () => {
    const positive = buildPlanOverrides({
      ...baseFormValues,
      amountCents: '0',
      minimumCommitment: {
        amountCents: '5000',
        invoiceDisplayName: 'Annual minimum',
        commitmentType: CommitmentTypeEnum.MinimumCommitment,
      },
    })

    expect(positive.minimumCommitment).toEqual({
      amountCents: 500000,
      invoiceDisplayName: 'Annual minimum',
    })

    const zero = buildPlanOverrides({
      ...baseFormValues,
      amountCents: '0',
      minimumCommitment: {
        amountCents: '0',
        commitmentType: CommitmentTypeEnum.MinimumCommitment,
      },
    })

    expect(zero.minimumCommitment).toBeUndefined()
  })

  it('builds usage thresholds from recurring and non-recurring thresholds', () => {
    const result = buildPlanOverrides({
      ...baseFormValues,
      amountCents: '0',
      nonRecurringUsageThresholds: [
        { amountCents: 10000, thresholdDisplayName: 'Tier 1', recurring: false },
      ],
      recurringUsageThreshold: {
        amountCents: 50000,
        thresholdDisplayName: 'Monthly cap',
        recurring: true,
      },
    })

    // Threshold form amounts ($10,000 and $50,000 units) → cents
    expect(result.usageThresholds).toEqual([
      { amountCents: 1000000, recurring: false, thresholdDisplayName: 'Tier 1' },
      { amountCents: 5000000, recurring: true, thresholdDisplayName: 'Monthly cap' },
    ])
  })
})

// ---------------------------------------------------------------------------
// buildPlanOverrides — diff against the catalog plan baseline (LAGO-1789)
// ---------------------------------------------------------------------------

describe('buildPlanOverrides with a catalog plan baseline', () => {
  const fixedCharge = {
    addOn: { code: 'setup_fee' },
    chargeModel: FixedChargeChargeModelEnum.Standard,
    properties: { amount: '100' },
  } as unknown as PlanFormInput['fixedCharges'][number]

  const usageCharge = {
    billableMetric: { code: 'api_calls' },
    chargeModel: ChargeModelEnum.Standard,
    properties: { amount: '0.01' },
  } as unknown as PlanFormInput['charges'][number]

  // A plan carrying every overridable field, so an untouched save proves each one
  // is diffed and not blindly forwarded.
  const fullyConfiguredPlan: PlanFormInput = {
    ...baseFormValues,
    invoiceDisplayName: 'Platform fee',
    fixedCharges: [fixedCharge],
    charges: [usageCharge],
    minimumCommitment: {
      amountCents: '5000',
      invoiceDisplayName: 'Annual minimum',
      commitmentType: CommitmentTypeEnum.MinimumCommitment,
    },
    nonRecurringUsageThresholds: [
      { amountCents: 10000, thresholdDisplayName: 'Tier 1', recurring: false },
    ] as PlanFormInput['nonRecurringUsageThresholds'],
    recurringUsageThreshold: {
      amountCents: 50000,
      thresholdDisplayName: 'Monthly cap',
      recurring: true,
    } as PlanFormInput['recurringUsageThreshold'],
  }

  it('returns no overrides when the form matches the catalog plan', () => {
    expect(buildPlanOverrides(baseFormValues, baseFormValues)).toEqual({})
  })

  it('returns no overrides for an untouched plan that configures every field', () => {
    expect(buildPlanOverrides(fullyConfiguredPlan, fullyConfiguredPlan)).toEqual({})
  })

  it('emits only the subscription fee when only the fee changed', () => {
    const result = buildPlanOverrides(
      { ...fullyConfiguredPlan, amountCents: '900.00' },
      fullyConfiguredPlan,
    )

    expect(result).toEqual({ amountCents: 90000 })
  })

  it('emits only the invoice display name when only that changed', () => {
    const result = buildPlanOverrides(
      { ...fullyConfiguredPlan, invoiceDisplayName: 'Acme platform fee' },
      fullyConfiguredPlan,
    )

    expect(result).toEqual({ invoiceDisplayName: 'Acme platform fee' })
  })

  it('emits the whole charges array when a single charge property changed', () => {
    const result = buildPlanOverrides(
      {
        ...fullyConfiguredPlan,
        charges: [
          { ...usageCharge, properties: { amount: '0.02' } } as PlanFormInput['charges'][number],
        ],
      },
      fullyConfiguredPlan,
    )

    // The backend replaces the whole usage charge set, so a single edit sends them
    // all. Fixed charges live under overrides.fixedCharges and stay untouched here.
    expect(Object.keys(result)).toEqual(['charges'])
    expect(result.charges).toHaveLength(1)
    expect(result.charges?.[0]).toEqual({
      billableMetricCode: 'api_calls',
      chargeModel: ChargeModelEnum.Standard,
      properties: { amount: '0.02' },
    })
  })

  it('emits only the minimum commitment when only that changed', () => {
    const result = buildPlanOverrides(
      {
        ...fullyConfiguredPlan,
        minimumCommitment: {
          amountCents: '7000',
          invoiceDisplayName: 'Annual minimum',
          commitmentType: CommitmentTypeEnum.MinimumCommitment,
        },
      },
      fullyConfiguredPlan,
    )

    expect(result).toEqual({
      minimumCommitment: { amountCents: 700000, invoiceDisplayName: 'Annual minimum' },
    })
  })

  it('emits only the usage thresholds when only those changed', () => {
    const result = buildPlanOverrides(
      {
        ...fullyConfiguredPlan,
        recurringUsageThreshold: {
          amountCents: 60000,
          thresholdDisplayName: 'Monthly cap',
          recurring: true,
        } as PlanFormInput['recurringUsageThreshold'],
      },
      fullyConfiguredPlan,
    )

    expect(Object.keys(result)).toEqual(['usageThresholds'])
    expect(result.usageThresholds).toEqual([
      { amountCents: 1000000, recurring: false, thresholdDisplayName: 'Tier 1' },
      { amountCents: 6000000, recurring: true, thresholdDisplayName: 'Monthly cap' },
    ])
  })

  it('keeps every configured field when no baseline is provided', () => {
    const result = buildPlanOverrides(fullyConfiguredPlan)

    expect(result.amountCents).toBe(85000)
    expect(result.invoiceDisplayName).toBe('Platform fee')
    expect(result.charges).toHaveLength(1)
    expect(result.fixedCharges).toHaveLength(1)
    expect(result.minimumCommitment).toBeDefined()
    expect(result.usageThresholds).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// toPlanBillingItems — baseline forwarding (LAGO-1789)
// ---------------------------------------------------------------------------

describe('toPlanBillingItems with a catalog plan baseline', () => {
  it('produces empty overrides for an unedited plan', () => {
    const result = toPlanBillingItems(basePricingState, baseFormValues, baseFormValues)

    expect(result.plans[0].overrides).toEqual({})
  })

  it('keeps the payload snapshot even when nothing is overridden', () => {
    const result = toPlanBillingItems(basePricingState, baseFormValues, baseFormValues)

    expect(result.plans[0].payload.amountCents).toBe('85000')
    expect(result.plans[0].payload.interval).toBe(PlanInterval.Monthly)
  })

  it('still emits the renamed plan alongside an otherwise unedited form', () => {
    const result = toPlanBillingItems(
      basePricingState,
      { ...baseFormValues, name: 'Enterprise Plan - Acme' },
      baseFormValues,
    )

    expect(result.plans[0].overrides).toEqual({ name: 'Enterprise Plan - Acme' })
  })

  // The real edit flow never compares two copies of the same object: the form values
  // come back from the stored quote payload (a JSON round-trip that dropped every
  // explicitly-undefined key) while the baseline comes straight from the plan query
  // (which carries __typename and keeps those keys). Both must still read as unchanged.
  it('produces empty overrides when the form is a payload round-trip of the baseline', () => {
    const baselineCharge = {
      billableMetric: { code: 'api_calls', __typename: 'BillableMetric' },
      chargeModel: ChargeModelEnum.Graduated,
      properties: {
        amount: undefined,
        graduatedRanges: [
          { fromValue: 0, toValue: 10, perUnitAmount: '1', flatAmount: '0', __typename: 'Range' },
        ],
        __typename: 'Properties',
      },
    } as unknown as PlanFormInput['charges'][number]

    const baseline: PlanFormInput = { ...baseFormValues, charges: [baselineCharge] }
    // What fromPlanBillingItems hands back after the payload was stored as JSON.
    const roundTripped: PlanFormInput = JSON.parse(JSON.stringify(baseline))

    const result = toPlanBillingItems(basePricingState, roundTripped, baseline)

    expect(result.plans[0].overrides).toEqual({})
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
    expect(result.basePlanName).toBe('Enterprise Plan')
    expect(result.planDescription).toBe('Custom enterprise offering')
    expect(result.overrides).toEqual({})
  })

  // A currency change makes the backend restamp the billing items, and an item whose only
  // deviation stopped being one comes back with no `overrides` key at all. Dereferencing it
  // took the whole quote editor down with a TypeError.
  describe.each([
    ['null', null],
    ['undefined', undefined],
  ])('GIVEN the API returned %s overrides', (_, overrides) => {
    it('THEN should deserialize the plan as having no overrides', () => {
      const result = fromPlanBillingItems([{ ...baseBillingItemPlan, overrides }])

      expect(result.overrides).toEqual({})
      expect(result.planName).toBe('Enterprise Plan')
      expect(result.basePlanName).toBe('Enterprise Plan')
      expect(result.planId).toBe('plan_123')
    })
  })

  it('falls back to the payload currency when the restamped item carries no overrides', () => {
    const plan = {
      ...baseBillingItemPlan,
      payload: {
        ...baseBillingItemPlan.payload,
        interval: PlanInterval.Monthly,
        amountCents: '1999',
        amountCurrency: CurrencyEnum.Eur,
        charges: [],
      },
      overrides: null,
    }

    const result = fromPlanBillingItems([plan])

    expect(result.formValues?.amountCurrency).toBe(CurrencyEnum.Eur)
    expect(result.formValues?.amountCents).toBe('19.99')
  })

  it('uses overrides.name as the effective name and payload.name as the base', () => {
    const plan: BillingItemPlan = {
      ...baseBillingItemPlan,
      overrides: { name: 'Enterprise Plan - Acme' },
    }
    const result = fromPlanBillingItems([plan])

    // Effective/display name is the override; base stays the original payload name.
    expect(result.planName).toBe('Enterprise Plan - Acme')
    expect(result.basePlanName).toBe('Enterprise Plan')
    expect(result.entityData.plan_123.name).toBe('Enterprise Plan - Acme')
  })

  it('deserializes subscription settings from payload', () => {
    const plan: BillingItemPlan = {
      ...baseBillingItemPlan,
      payload: {
        ...baseBillingItemPlan.payload,
        subscriptionExternalId: 'ext_001',
        subscriptionName: 'My Sub',
        billingTime: 'calendar',
        startDate: '2023-07-26',
        endDate: '2024-07-26',
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
        paymentMethodId: 'pm_456',
        invoiceCustomFooter: 'Footer text',
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
        amountCents: 85000,
        charges: [
          {
            billableMetricCode: 'cpu',
            chargeModel: 'graduated',
            properties: { graduated_ranges: [] },
          },
        ],
      },
    }
    const result = fromPlanBillingItems([plan])

    expect(result.overrides.amountCents).toBe(85000)
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
        plan: { rows: [] },
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
    // Round-trips through cents: '850.00' → 85000 → deserialize → '850'
    expect(deserialized.formValues?.amountCents).toBe('850')
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

  it('round-trips an overridden plan name (base in payload, override in overrides)', () => {
    const formValues: PlanFormInput = {
      ...baseFormValues,
      name: 'Enterprise Plan - Acme',
    }

    const serialized = toPlanBillingItems(basePricingState, formValues)

    expect(serialized.plans[0].payload.name).toBe('Enterprise Plan')
    expect(serialized.plans[0].overrides.name).toBe('Enterprise Plan - Acme')

    const deserialized = fromPlanBillingItems(serialized.plans)

    expect(deserialized.basePlanName).toBe('Enterprise Plan')
    expect(deserialized.planName).toBe('Enterprise Plan - Acme')
    expect(deserialized.formValues?.name).toBe('Enterprise Plan - Acme')
  })

  it('backward compat: legacy payload without interval/charges returns null formValues', () => {
    // Simulate a payload that was serialized before the plan form data was added
    const legacyPlan: BillingItemPlan = {
      type: 'plan',
      id: 'plan_legacy',
      payload: {
        position: 1,
        code: 'legacy',
        name: 'Legacy Plan',
        description: 'Old plan',
        subscriptionExternalId: 'ext_old',
        subscriptionName: null,
        billingTime: 'calendar',
        startDate: '2022-01-01',
        endDate: null,
        paymentMethodId: null,
        invoiceCustomFooter: null,
        // NOTE: no interval, no charges — legacy payload
      },
      overrides: { amountCents: 75000 },
    }

    const result = fromPlanBillingItems([legacyPlan])

    // formValues must be null — no reconstruction possible from legacy payload
    expect(result.formValues).toBeNull()

    // But core fields still work
    expect(result.planId).toBe('plan_legacy')
    expect(result.planCode).toBe('legacy')
    expect(result.subscriptionSettings.externalId).toBe('ext_old')
    expect(result.subscriptionSettings.billingTime).toBe('calendar')
    expect(result.overrides.amountCents).toBe(75000)
  })

  it('attaches PlanPreviewData to the plan entity (fromPlanBillingItems)', () => {
    // Build a plans payload with full data (interval + charges present).
    const plans = [
      {
        type: 'plan',
        id: 'plan-1',
        overrides: {},
        payload: {
          position: 0,
          code: 'p',
          name: 'P',
          description: '',
          subscriptionExternalId: null,
          subscriptionName: null,
          billingTime: 'calendar',
          startDate: null,
          endDate: null,
          paymentMethodId: null,
          invoiceCustomFooter: null,
          interval: 'monthly',
          amountCents: '13050',
          amountCurrency: 'USD',
          payInAdvance: true,
          charges: [],
          fixedCharges: [],
          minimumCommitment: null,
        },
      },
    ] as any

    const result = fromPlanBillingItems(plans)

    expect(result.entityData['plan-1'].plan).toBeDefined()
    expect(result.entityData['plan-1'].plan?.rows[0]).toMatchObject({
      kind: 'main',
      rowType: 'subscriptionFee',
      // payload cents '13050' → deserialized to currency units '130.5' for display
      price: { type: 'displayAmount', amount: '130.5' },
    })
  })

  it('leaves plan undefined for a legacy payload (no interval/charges)', () => {
    const plans = [
      {
        type: 'plan',
        id: 'plan-legacy',
        overrides: {},
        payload: {
          position: 0,
          code: 'p',
          name: 'P',
          description: '',
          subscriptionExternalId: null,
          subscriptionName: null,
          billingTime: 'calendar',
          startDate: null,
          endDate: null,
          paymentMethodId: null,
          invoiceCustomFooter: null,
        },
      },
    ] as any

    const result = fromPlanBillingItems(plans)

    expect(result.entityData['plan-legacy'].plan).toEqual({ rows: [] })
  })
})

// ---------------------------------------------------------------------------
// Amount serialization: form holds currency units, payload holds cents
// ---------------------------------------------------------------------------

describe('plan amount cents conversion', () => {
  it('serializes the subscription fee from currency units to cents (buildPlanOverrides)', () => {
    const result = buildPlanOverrides({
      ...baseFormValues,
      amountCents: '850.00',
      amountCurrency: CurrencyEnum.Usd,
    })

    expect(result.amountCents).toBe(85000)
  })

  it('serializes minimum commitment and usage thresholds to cents', () => {
    const result = buildPlanOverrides({
      ...baseFormValues,
      amountCents: '0',
      amountCurrency: CurrencyEnum.Usd,
      minimumCommitment: {
        amountCents: '5000',
        commitmentType: CommitmentTypeEnum.MinimumCommitment,
      },
      nonRecurringUsageThresholds: [
        { amountCents: 100, thresholdDisplayName: 'Tier 1', recurring: false },
      ],
      recurringUsageThreshold: {
        amountCents: 500,
        thresholdDisplayName: 'Cap',
        recurring: true,
      },
    })

    expect(result.minimumCommitment?.amountCents).toBe(500000)
    expect(result.usageThresholds).toEqual([
      { amountCents: 10000, recurring: false, thresholdDisplayName: 'Tier 1' },
      { amountCents: 50000, recurring: true, thresholdDisplayName: 'Cap' },
    ])
  })

  it('serializes the subscription fee to cents in the payload', () => {
    const result = toPlanBillingItems(basePricingState, {
      ...baseFormValues,
      amountCents: '850.00',
      amountCurrency: CurrencyEnum.Usd,
    })

    expect(result.plans[0].payload.amountCents).toBe('85000')
  })

  it('respects zero-decimal currency (JPY) precision — no ×100', () => {
    const result = buildPlanOverrides({
      ...baseFormValues,
      amountCents: '850',
      amountCurrency: CurrencyEnum.Jpy,
    })

    expect(result.amountCents).toBe(850)
  })

  it('deserializes payload cents back into currency units on read', () => {
    const plan: BillingItemPlan = {
      type: 'plan',
      id: 'plan_123',
      overrides: {},
      payload: {
        ...baseBillingItemPlan.payload,
        interval: PlanInterval.Monthly,
        amountCents: '85000',
        amountCurrency: 'USD',
        payInAdvance: false,
        charges: [],
        fixedCharges: [],
        minimumCommitment: null,
      },
    } as unknown as BillingItemPlan

    const result = fromPlanBillingItems([plan])

    expect(result.formValues?.amountCents).toBe('850')
  })

  it('round-trips subscription fee units → cents → units', () => {
    const serialized = toPlanBillingItems(basePricingState, {
      ...baseFormValues,
      amountCents: '850.00',
      amountCurrency: CurrencyEnum.Usd,
      charges: [],
    })
    const deserialized = fromPlanBillingItems(serialized.plans)

    expect(deserialized.formValues?.amountCents).toBe('850')
  })
})

// ---------------------------------------------------------------------------
// planFormSchema round-trip — a saved plan must stay re-savable
// ---------------------------------------------------------------------------

describe('GIVEN a plan billing item saved from the quote drawer', () => {
  // What `buildDefaultValues` seeds for a plan with neither a negotiated commitment
  // nor progressive billing — the state the drawer reopens with.
  const untouchedOptionals: PlanFormInput = {
    ...baseFormValues,
    minimumCommitment: {},
    nonRecurringUsageThresholds: undefined,
    recurringUsageThreshold: undefined,
  }

  const roundTrip = (formValues: PlanFormInput): PlanFormInput | null =>
    fromPlanBillingItems(toPlanBillingItems(basePricingState, formValues).plans).formValues

  describe('WHEN the plan is read back for editing', () => {
    it('THEN should still satisfy planFormSchema without a commitment or thresholds', () => {
      const result = planFormSchema.safeParse(roundTrip(untouchedOptionals))

      expect(result.success).toBe(true)
    })

    it('THEN should not rebuild a phantom zero minimum commitment', () => {
      expect(roundTrip(untouchedOptionals)?.minimumCommitment).toEqual({})
    })

    it('THEN should leave progressive billing unset rather than an empty list', () => {
      expect(roundTrip(untouchedOptionals)?.nonRecurringUsageThresholds).toBeUndefined()
    })

    it('THEN should still satisfy planFormSchema with a fixed charge', () => {
      const fixedCharge = {
        addOn: { id: 'addon_1', name: 'Setup Fee', code: 'setup_fee' },
        chargeModel: FixedChargeChargeModelEnum.Standard,
        units: '5',
        properties: { amount: '100' },
        taxCodes: [],
        taxes: [],
      } as unknown as LocalFixedChargeInput

      const result = planFormSchema.safeParse(
        roundTrip({ ...untouchedOptionals, fixedCharges: [fixedCharge] }),
      )

      expect(result.success).toBe(true)
    })

    it('THEN should preserve a real minimum commitment', () => {
      const formValues: PlanFormInput = {
        ...untouchedOptionals,
        minimumCommitment: {
          amountCents: '5000',
          commitmentType: CommitmentTypeEnum.MinimumCommitment,
        },
      }

      expect(roundTrip(formValues)?.minimumCommitment?.amountCents).toBe('5000')
      expect(planFormSchema.safeParse(roundTrip(formValues)).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// Payload alignment on the quoted (baseline) plan
// ---------------------------------------------------------------------------

const usageCharge = (id: string, metricCode: string): LocalUsageChargeInput =>
  ({
    id,
    billableMetric: {
      id: `bm_${metricCode}`,
      code: metricCode,
      name: metricCode,
      aggregationType: AggregationTypeEnum.CountAgg,
      recurring: false,
      filters: [],
    },
    chargeModel: ChargeModelEnum.Standard,
    properties: { amount: '10' },
    invoiceDisplayName: '',
    payInAdvance: false,
    prorated: false,
    invoiceable: true,
    taxCodes: [],
  }) as LocalUsageChargeInput

const fixedCharge = (id: string, addOnCode: string): LocalFixedChargeInput =>
  ({
    id,
    addOn: { id: `addon_${addOnCode}`, name: addOnCode, code: addOnCode },
    chargeModel: FixedChargeChargeModelEnum.Standard,
    units: '1',
    applyUnitsImmediately: false,
    invoiceDisplayName: null,
    payInAdvance: false,
    prorated: false,
    properties: { amount: '20' },
    taxCodes: [],
  }) as LocalFixedChargeInput

describe('toPlanBillingItems — snapshot ids are bound to the quoted plan', () => {
  describe('GIVEN a subscription amendment, whose form is seeded from the override child while the quote points at the catalog parent', () => {
    // The child carries its own charge ids; the catalog plan the billing item names
    // carries the ones the backend resolves overrides against.
    const childCharge = usageCharge('child_charge', 'count_bm')
    const catalogCharge = usageCharge('catalog_charge', 'count_bm')
    const childFixedCharge = fixedCharge('child_fixed_charge', 'support')
    const catalogFixedCharge = fixedCharge('catalog_fixed_charge', 'support')

    const formValues: PlanFormInput = {
      ...baseFormValues,
      name: 'Enterprise Plan with Override',
      amountCents: '211.00',
      charges: [childCharge],
      fixedCharges: [childFixedCharge],
    }
    const baselineFormValues: PlanFormInput = {
      ...baseFormValues,
      name: 'Enterprise Plan',
      charges: [catalogCharge],
      fixedCharges: [catalogFixedCharge],
    }

    describe('WHEN the billing item is serialized', () => {
      it('THEN should rebind the snapshot charge ids on the catalog charges sharing the billable metric', () => {
        const result = toPlanBillingItems(basePricingState, formValues, baselineFormValues)

        expect(result.plans[0].payload.charges?.[0].id).toBe('catalog_charge')
        expect(result.plans[0].payload.fixedCharges?.[0].id).toBe('catalog_fixed_charge')
      })

      it('THEN should keep the negotiated values as overrides rather than in the snapshot', () => {
        // The seeded state carries the child's name, as it does on a first open.
        const state: SubscriptionPricingState = {
          ...basePricingState,
          planName: 'Enterprise Plan with Override',
          basePlanName: 'Enterprise Plan with Override',
        }
        const result = toPlanBillingItems(state, formValues, baselineFormValues)

        // The snapshot still describes what was negotiated, only its ids move.
        expect(result.plans[0].payload.charges?.[0].properties).toEqual({ amount: '10' })
        expect(result.plans[0].overrides.amountCents).toBe(21100)
        expect(result.plans[0].payload.name).toBe('Enterprise Plan')
        expect(result.plans[0].overrides.name).toBe('Enterprise Plan with Override')
      })
    })
  })

  describe('GIVEN no baseline plan is resolved', () => {
    describe('WHEN the billing item is serialized', () => {
      it('THEN should leave the snapshot ids untouched', () => {
        const formValues: PlanFormInput = {
          ...baseFormValues,
          charges: [usageCharge('own_charge', 'count_bm')],
          fixedCharges: [fixedCharge('own_fixed_charge', 'support')],
        }

        const result = toPlanBillingItems(basePricingState, formValues)

        expect(result.plans[0].payload.charges?.[0].id).toBe('own_charge')
        expect(result.plans[0].payload.fixedCharges?.[0].id).toBe('own_fixed_charge')
      })
    })
  })

  describe('GIVEN a charge the baseline plan does not carry', () => {
    describe('WHEN the billing item is serialized', () => {
      it('THEN should leave that charge id untouched, having nothing to bind it to', () => {
        const formValues: PlanFormInput = {
          ...baseFormValues,
          charges: [usageCharge('child_charge', 'count_bm'), usageCharge('added_charge', 'sum_bm')],
        }
        const baselineFormValues: PlanFormInput = {
          ...baseFormValues,
          charges: [usageCharge('catalog_charge', 'count_bm')],
        }

        const result = toPlanBillingItems(basePricingState, formValues, baselineFormValues)

        expect(result.plans[0].payload.charges?.[0].id).toBe('catalog_charge')
        expect(result.plans[0].payload.charges?.[1].id).toBe('added_charge')
      })
    })
  })

  describe('GIVEN the baseline plan carries two charges on the same billable metric', () => {
    describe('WHEN the billing item is serialized', () => {
      it('THEN should leave the id untouched rather than bind it to an arbitrary one', () => {
        const formValues: PlanFormInput = {
          ...baseFormValues,
          charges: [usageCharge('child_charge', 'count_bm')],
        }
        const baselineFormValues: PlanFormInput = {
          ...baseFormValues,
          charges: [
            usageCharge('catalog_charge_a', 'count_bm'),
            usageCharge('catalog_charge_b', 'count_bm'),
          ],
        }

        const result = toPlanBillingItems(basePricingState, formValues, baselineFormValues)

        expect(result.plans[0].payload.charges?.[0].id).toBe('child_charge')
      })
    })
  })
})
