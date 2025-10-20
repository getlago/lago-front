import { LocalPricingUnitType, PlanFormInput } from '~/components/plans/types'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  PlanOverridesInput,
  RegroupPaidFeesEnum,
} from '~/generated/graphql'
import { cleanPlanValues } from '~/hooks/customer/useAddSubscription'

describe('cleanPlanValues', () => {
  // Mock plan form input with all the fields that exist in the form but should be cleaned
  const mockPlanFormInput: PlanFormInput = {
    name: 'Test Plan',
    code: 'PLAN_CODE',
    description: 'Test Description',
    interval: PlanInterval.Monthly,
    entitlements: [],
    amountCents: '1000',
    amountCurrency: CurrencyEnum.Usd,
    trialPeriod: 7,
    invoiceDisplayName: 'Test Invoice Display Name',
    payInAdvance: true,
    billChargesMonthly: false,
    taxCodes: ['TAX001', 'TAX002'],
    taxes: [
      {
        id: 'tax-1',
        name: 'Tax 1',
        code: 'TAX001',
        rate: 0.1,
      },
    ],
    cascadeUpdates: true,
    nonRecurringUsageThresholds: [
      {
        amountCents: 1000,
        recurring: false,
        thresholdDisplayName: 'Non-recurring threshold',
      },
    ],
    recurringUsageThreshold: {
      amountCents: 5000,
      recurring: true,
      thresholdDisplayName: 'Recurring threshold',
    },
    fixedCharges: [],
    charges: [
      {
        id: 'charge-1',
        billableMetric: {
          id: 'metric-1',
          name: 'Metric 1',
          code: 'METRIC_1',
          aggregationType: AggregationTypeEnum.CountAgg,
          recurring: false,
        },
        chargeModel: ChargeModelEnum.Standard,
        invoiceDisplayName: 'Charge 1',
        minAmountCents: '100',
        payInAdvance: true,
        invoiceable: true,
        prorated: false,
        regroupPaidFees: RegroupPaidFeesEnum.Invoice,
        properties: {
          amount: '10.00',
          rate: '0.05',
        },
        appliedPricingUnit: {
          code: CurrencyEnum.Usd,
          conversionRate: '2.5',
          shortName: 'USD',
          type: LocalPricingUnitType.Fiat,
        },
        taxCodes: ['TAX003'],
        taxes: [
          {
            id: 'tax-3',
            name: 'Tax 3',
            code: 'TAX003',
            rate: 0.05,
          },
        ],
        filters: [],
      },
    ],
  }

  const mockPlanOverrides = mockPlanFormInput as unknown as PlanOverridesInput

  it('should clean plan values and preserve taxCodes', () => {
    const result = cleanPlanValues(mockPlanOverrides)

    // Should preserve valid PlanOverridesInput fields
    expect(result.name).toBe('Test Plan')
    expect(result.description).toBe('Test Description')
    expect(result.amountCents).toBe('1000')
    expect(result.trialPeriod).toBe(7)
    expect(result.invoiceDisplayName).toBe('Test Invoice Display Name')
    expect(result.taxCodes).toEqual(['TAX001', 'TAX002']) // Should be preserved for creation

    // Should remove plan-level fields not in PlanOverridesInput
    expect(result.code).toBeUndefined()
    expect(result.interval).toBeUndefined()
    expect(result.taxes).toBeUndefined()
    expect(result.payInAdvance).toBeUndefined()
    expect(result.billChargesMonthly).toBeUndefined()
    expect(result.cascadeUpdates).toBeUndefined()

    // Should clean charges
    expect(result.charges).toHaveLength(1)
    const cleanedCharge = result.charges?.[0]

    // Should preserve valid charge fields
    expect(cleanedCharge?.id).toBe('charge-1')
    expect(cleanedCharge?.invoiceDisplayName).toBe('Charge 1')
    expect(cleanedCharge?.minAmountCents).toBe('100')
    expect(cleanedCharge?.properties).toEqual({
      amount: '10.00',
      rate: '0.05',
    })
    expect(cleanedCharge?.taxCodes).toEqual(['TAX003'])
    //   appliedPricingUnit should only contain conversionRate
    expect(cleanedCharge?.appliedPricingUnit).toEqual({ conversionRate: 2.5 })

    // Should remove charge fields not in ChargeOverridesInput
    expect(cleanedCharge?.taxes).toBeUndefined()
    expect(cleanedCharge?.payInAdvance).toBeUndefined()
    expect(cleanedCharge?.billableMetric).toBeUndefined()
    expect(cleanedCharge?.chargeModel).toBeUndefined()
    expect(cleanedCharge?.invoiceable).toBeUndefined()
    expect(cleanedCharge?.prorated).toBeUndefined()
    expect(cleanedCharge?.regroupPaidFees).toBeUndefined()
  })

  describe('edge cases', () => {
    it('should handle empty plan values', () => {
      const emptyPlanValues: PlanOverridesInput = {}
      const result = cleanPlanValues(emptyPlanValues)

      expect(result).toEqual({
        code: undefined,
        interval: undefined,
        taxCodes: undefined,
        taxes: undefined,
        payInAdvance: undefined,
        billChargesMonthly: undefined,
        cascadeUpdates: undefined,
        charges: undefined,
      })
    })

    it('should handle plan values with empty charges array', () => {
      const planWithEmptyCharges: PlanOverridesInput = {
        name: 'Test Plan',
        charges: [],
      }
      const result = cleanPlanValues(planWithEmptyCharges)

      expect(result.charges).toEqual([])
      expect(result.name).toBe('Test Plan')
    })

    it('should handle charge with string conversion rate', () => {
      const planWithStringConversionRate: PlanOverridesInput = {
        charges: [
          {
            billableMetricId: 'metric-1',
            appliedPricingUnit: {
              conversionRate: 3.14159,
            },
          },
        ],
      }
      const result = cleanPlanValues(planWithStringConversionRate)

      expect(result.charges?.[0]?.appliedPricingUnit?.conversionRate).toBe(3.14159)
    })

    it('should handle charge without appliedPricingUnit', () => {
      const planWithoutPricingUnit: PlanOverridesInput = {
        charges: [
          {
            billableMetricId: 'metric-1',
          },
        ],
      }
      const result = cleanPlanValues(planWithoutPricingUnit)

      expect(result.charges?.[0]?.appliedPricingUnit).toBeUndefined()
    })
  })
})
