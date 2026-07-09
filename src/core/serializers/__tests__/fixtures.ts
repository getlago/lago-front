import type { BillingItemsPayload } from '../serializeQuoteBillingItems'

/**
 * Example `BillingItemsPayload` for **add-on** pricing.
 *
 * Mirrors the backend contract: `payload` is the API baseline, `overrides`
 * carries only the fields the user changed in the pricing drawer (here, a
 * negotiated discount). `position`, `code` and `taxCodes` are not overridable.
 */
export const addOnBillingItemsFixture: BillingItemsPayload = {
  addOns: [
    {
      type: 'add_on',
      id: 'addon_01HXY',
      localId: 'a1b2c3d4-e5f6-0000-1111-222233334444',
      payload: {
        position: 1,
        code: 'setup_fee',
        name: 'Setup Fee',
        description: 'One-time onboarding and setup',
        units: 1,
        unitAmountCents: 50000,
        totalAmountCents: 50000,
        invoiceDisplayName: 'Initial setup',
        fromDatetime: null,
        toDatetime: null,
        taxCodes: ['vat_20'],
      },
      overrides: {
        unitAmountCents: 45000,
        totalAmountCents: 45000,
      },
    },
  ],
}

/**
 * Example `BillingItemsPayload` for **plan** pricing.
 *
 * `payload` includes the optional plan-config fields (interval / amount /
 * charges) the FE persists for form reconstruction. `overrides` exercises the
 * full `PlanOverrides` shape — plan amount, display name, minimum commitment,
 * a charge override and a usage threshold. Note amounts in `overrides` are
 * numbers, while serialized `payload.amountCents` is a string.
 */
export const planBillingItemsFixture: BillingItemsPayload = {
  addOns: [],
  plans: [
    {
      type: 'plan',
      id: 'plan_01HXY',
      payload: {
        position: 1,
        code: 'enterprise',
        name: 'Enterprise Plan',
        description: 'Custom enterprise offering',

        subscriptionExternalId: 'sub_ext_acme_001',
        subscriptionName: 'Acme Corp subscription',
        billingTime: 'anniversary',
        startDate: '2026-07-01',
        endDate: null,
        paymentMethodId: null,
        invoiceCustomFooter: null,

        // --- plan configuration ---
        interval: 'monthly',
        amountCents: '100000',
        amountCurrency: 'USD',
        payInAdvance: true,
        billChargesMonthly: null,
        billFixedChargesMonthly: null,
        trialPeriod: 14,
        invoiceDisplayName: 'Enterprise',
        taxCodes: ['vat_20'],
        taxes: [{ id: 'tax_01H', code: 'vat_20', name: 'VAT 20%', rate: 20 }],

        // --- charges ---
        charges: [
          {
            id: 'charge_01H',
            billableMetric: {
              id: 'bm_01H',
              code: 'api_calls',
              name: 'API Calls',
              aggregationType: 'sum_agg',
              recurring: false,
              filters: [],
            },
            chargeModel: 'standard',
            properties: { amount: '0.01' },
            invoiceDisplayName: 'API usage',
            minAmountCents: '0',
            payInAdvance: false,
            prorated: false,
            regroupPaidFees: null,
            invoiceable: true,
            taxCodes: [],
            taxes: [],
            filters: [],
            appliedPricingUnit: null,
          },
        ],
        fixedCharges: [],

        // --- commitments & thresholds ---
        minimumCommitment: {
          id: 'mc_01H',
          amountCents: '50000',
          invoiceDisplayName: 'Monthly minimum',
          commitmentType: 'minimum_commitment',
          taxCodes: [],
          taxes: [],
        },
        nonRecurringUsageThresholds: [],
        recurringUsageThreshold: null,
      },
      overrides: {
        amountCents: 90000,
        invoiceDisplayName: 'Enterprise (negotiated)',
        minimumCommitment: {
          amountCents: 45000,
          invoiceDisplayName: 'Negotiated monthly minimum',
        },
        charges: [
          {
            billableMetricCode: 'api_calls',
            chargeModel: 'standard',
            properties: { amount: '0.008' },
          },
        ],
        usageThresholds: [
          {
            amountCents: 200000,
            recurring: false,
            thresholdDisplayName: 'Annual usage cap',
          },
        ],
      },
    },
  ],
}
