// src/core/serializers/__tests__/buildPlanPreviewData.test.ts
import { ChargeModelEnum, PlanInterval } from '~/generated/graphql'
import { buildPlanPreviewData } from '~/core/serializers/buildPlanPreviewData'
import type { PlanFormInput, PlanPayload } from '~/core/serializers/serializeQuotePlanBillingItems'

// Minimal payload/formValues factories — extend per test.
const basePayload = (over: Partial<PlanPayload> = {}): PlanPayload =>
  ({
    position: 0,
    plan_code: 'plan_code',
    plan_name: 'My Plan',
    plan_description: '',
    subscription_external_id: null,
    subscription_name: null,
    billing_time: 'calendar',
    start_date: null,
    end_date: null,
    payment_method_id: null,
    invoice_custom_footer: null,
    ...over,
  }) as PlanPayload

const baseForm = (over: Partial<PlanFormInput> = {}): PlanFormInput =>
  ({
    interval: PlanInterval.Monthly,
    amountCents: '0',
    amountCurrency: 'USD',
    payInAdvance: true,
    charges: [],
    fixedCharges: [],
    minimumCommitment: undefined,
    nonRecurringUsageThresholds: [],
    entitlements: [],
    name: 'My Plan',
    code: 'plan_code',
    description: '',
    taxCodes: [],
    taxes: [],
    ...over,
  }) as unknown as PlanFormInput

describe('buildPlanPreviewData', () => {
  it('returns empty rows for a legacy plan (formValues null)', () => {
    expect(buildPlanPreviewData(null, basePayload())).toEqual({ rows: [] })
  })

  it('renders a subscription-fee main row when amountCents > 0 (advance → beginningOfPeriod)', () => {
    const data = buildPlanPreviewData(
      baseForm({ amountCents: '13050', payInAdvance: true, interval: PlanInterval.Monthly }),
      basePayload(),
    )
    expect(data.rows[0]).toEqual({
      kind: 'main',
      rowType: 'subscriptionFee',
      name: undefined, // no invoiceDisplayName → component shows translated "Subscription fee"
      description: undefined,
      interval: PlanInterval.Monthly,
      timing: 'beginningOfPeriod',
      units: { type: 'count', value: 1 },
      price: { type: 'amount', amountCents: '13050' },
    })
  })

  it('omits the subscription-fee row when amountCents is 0', () => {
    const data = buildPlanPreviewData(baseForm({ amountCents: '0' }), basePayload())
    expect(data.rows.find((r) => r.kind === 'main' && r.rowType === 'subscriptionFee')).toBeUndefined()
  })

  it('renders a fixed charge main row (units + amount, arrears → endOfPeriod)', () => {
    const data = buildPlanPreviewData(
      baseForm({
        amountCents: '0',
        interval: PlanInterval.Yearly,
        fixedCharges: [
          {
            chargeModel: ChargeModelEnum.Standard,
            payInAdvance: false,
            units: '5',
            invoiceDisplayName: 'Seats',
            properties: { amount: '200.00' },
            addOn: { name: 'Seat add-on', code: 'seat' },
          },
        ] as unknown as PlanFormInput['fixedCharges'],
      }),
      basePayload(),
    )
    const row = data.rows.find((r) => r.kind === 'main' && r.rowType === 'fixedCharge')
    expect(row).toMatchObject({
      kind: 'main',
      rowType: 'fixedCharge',
      name: 'Seats',
      interval: PlanInterval.Yearly,
      timing: 'endOfPeriod',
      units: { type: 'count', value: 5 },
      price: { type: 'amount', amountCents: '200.00' },
    })
  })

  it('renders a standard usage charge as a main usage row + a single "Usage / perUnit" detail row', () => {
    const data = buildPlanPreviewData(
      baseForm({
        charges: [
          {
            chargeModel: ChargeModelEnum.Standard,
            payInAdvance: false,
            invoiceDisplayName: 'API calls',
            billableMetric: { name: 'API calls', code: 'api' },
            properties: { amount: '1.20' },
            filters: [],
          },
        ] as unknown as PlanFormInput['charges'],
      }),
      basePayload(),
    )
    const main = data.rows.find((r) => r.kind === 'main' && r.rowType === 'usageCharge')
    expect(main).toMatchObject({
      kind: 'main',
      rowType: 'usageCharge',
      name: 'API calls',
      timing: 'endOfPeriod',
      units: { type: 'usageBased' },
      price: { type: 'variesWithUsage' },
    })
    expect(data.rows).toContainEqual({
      kind: 'detail',
      label: { type: 'text', key: 'labelUsage' },
      qualifier: { type: 'perUnit' },
      value: { type: 'amount', amountCents: '1.20' },
    })
  })

  it('renders a plan minimum commitment as its own main row (units 1 + amount)', () => {
    const data = buildPlanPreviewData(
      baseForm({
        minimumCommitment: {
          amountCents: '1000.00',
          invoiceDisplayName: undefined,
        } as unknown as PlanFormInput['minimumCommitment'],
      }),
      basePayload(),
    )
    const row = data.rows.find((r) => r.kind === 'main' && r.rowType === 'minimumCommitment')
    expect(row).toMatchObject({
      kind: 'main',
      rowType: 'minimumCommitment',
      units: { type: 'count', value: 1 },
      price: { type: 'amount', amountCents: '1000.00' },
    })
  })

  it('renders graduated ranges: per-unit row per tier, flat-fee row only when present', () => {
    const data = buildPlanPreviewData(
      baseForm({
        charges: [
          {
            chargeModel: ChargeModelEnum.Graduated,
            payInAdvance: false,
            invoiceDisplayName: 'Tiered',
            billableMetric: { name: 'Tiered', code: 't' },
            filters: [],
            properties: {
              graduatedRanges: [
                { fromValue: 0, toValue: 10, perUnitAmount: '0.00', flatAmount: '10.00' },
                { fromValue: 11, toValue: 100, perUnitAmount: '0.10', flatAmount: '0' },
                { fromValue: 101, toValue: null, perUnitAmount: '0.05', flatAmount: '0' },
              ],
            },
          },
        ] as unknown as PlanFormInput['charges'],
      }),
      basePayload(),
    )
    const details = data.rows.filter((r) => r.kind === 'detail')
    expect(details).toContainEqual({
      kind: 'detail',
      label: { type: 'tierRange', from: 0, to: 10 },
      qualifier: { type: 'perUnit' },
      value: { type: 'amount', amountCents: '0.00' },
    })
    // flat fee shown for tier 1 (10.00) but not tiers 2/3 (0)
    expect(details).toContainEqual({
      kind: 'detail',
      label: { type: 'flatFeeForTier', from: 0, to: 10 },
      qualifier: { type: 'flatFee' },
      value: { type: 'amount', amountCents: '10.00' },
    })
    expect(details.filter((d) => d.label.type === 'flatFeeForTier')).toHaveLength(1)
    // last tier is open-ended
    expect(details).toContainEqual({
      kind: 'detail',
      label: { type: 'tierRange', from: 101, to: undefined },
      qualifier: { type: 'perUnit' },
      value: { type: 'amount', amountCents: '0.05' },
    })
  })

  it('renders volume ranges identically to graduated (perUnit + optional flat fee)', () => {
    const data = buildPlanPreviewData(
      baseForm({
        charges: [
          {
            chargeModel: ChargeModelEnum.Volume,
            payInAdvance: false,
            invoiceDisplayName: 'Vol',
            billableMetric: { name: 'Vol', code: 'v' },
            filters: [],
            properties: {
              volumeRanges: [{ fromValue: 0, toValue: 10, perUnitAmount: '0.10', flatAmount: '10.00' }],
            },
          },
        ] as unknown as PlanFormInput['charges'],
      }),
      basePayload(),
    )
    const details = data.rows.filter((r) => r.kind === 'detail')
    expect(details).toContainEqual({
      kind: 'detail',
      label: { type: 'tierRange', from: 0, to: 10 },
      qualifier: { type: 'perUnit' },
      value: { type: 'amount', amountCents: '0.10' },
    })
    expect(details).toContainEqual({
      kind: 'detail',
      label: { type: 'flatFeeForTier', from: 0, to: 10 },
      qualifier: { type: 'flatFee' },
      value: { type: 'amount', amountCents: '10.00' },
    })
  })
})
