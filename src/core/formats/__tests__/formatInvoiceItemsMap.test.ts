import { InvoiceSubscriptionsForDisplay } from '~/components/invoices/types'
import { ALL_FILTER_VALUES } from '~/core/constants/form'
import {
  _newDeepFormatFees,
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
  getSubscriptionFeeDisplayName,
  groupAndFormatFees,
  TExtendedRemainingFee,
} from '~/core/formats/formatInvoiceItemsMap'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  FeeTypesEnum,
} from '~/generated/graphql'

import {
  chargeZeroAmount,
  chargeZeroAmountDraftInvoice,
  chargeZeroAmountDraftInvoiceResult,
  chargeZeroAmountResult,
  newChargeZeroAmountDraftInvoiceResult,
  newNoFeesResult,
  newOrderedSubscriptionWithFees,
  noFees,
  noFeesResult,
  oneSubscription,
  oneSubscriptionResult,
  orderedSubscriptionWithFees,
  subZeroAmount,
  subZeroAmountResult,
  twoSubscriptions,
  twoSubscriptionsResult,
  unorderedSubscriptionWithFees,
} from './fixture'

describe('formatInvoiceItemsMap', () => {
  describe('getSubscriptionFeeDisplayName', () => {
    it('should return the plan name formated by default', () => {
      const fee = {
        invoiceDisplayName: null,
        subscription: {
          plan: {
            name: 'Plan name',
            interval: 'monthly',
          },
        },
      }

      const result = getSubscriptionFeeDisplayName(fee as TExtendedRemainingFee)

      expect(result).toEqual('Monthly subscription fee - Plan name')
    })

    it('should return the invoiceDisplayName if it exists', () => {
      const fee = {
        invoiceDisplayName: 'Custom invoice display name',
        subscription: {
          plan: {
            interval: 'monthly',
          },
        },
      }

      const result = getSubscriptionFeeDisplayName(fee as TExtendedRemainingFee)

      expect(result).toEqual('Custom invoice display name')
    })
  })

  describe('groupAndFormatFees', () => {
    describe('if hasOldZeroFeeManagement: true', () => {
      it('should return default values if there are no data', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: [],
          hasOldZeroFeeManagement: true,
        })

        expect(result).toEqual({
          subscriptions: {},
          metadata: {
            hasAnyFeeParsed: false,
            hasAnyPositiveFeeParsed: false,
          },
        })
      })
      it('should return default values if there are no fees', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: noFees as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: true,
        })

        expect(result).toEqual(noFeesResult)
      })
      it('should return default values if there are only sub fee with 0 amountCents', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: subZeroAmount as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: true,
        })

        expect(result).toEqual(subZeroAmountResult)
      })
      it('should return default values if there are only sub fee with 0 amountCents and 0 units', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: chargeZeroAmount as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: true,
        })

        expect(result).toEqual(noFeesResult)
      })
      it('should return all values if invoice has draft status', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions:
            chargeZeroAmountDraftInvoice as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: true,
        })

        expect(result).toEqual(chargeZeroAmountDraftInvoiceResult)
      })
      it('should return the correct values if there are 1 subscription', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: oneSubscription as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: true,
        })

        expect(result).toEqual(oneSubscriptionResult)
      })
      it('should return the correct values if there are 2 subscription', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: twoSubscriptions as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: true,
        })

        expect(result).toEqual(twoSubscriptionsResult)
      })
      it('should return the correct order for a given subscription', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions:
            unorderedSubscriptionWithFees as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: true,
        })

        expect(result).toEqual(orderedSubscriptionWithFees)
      })
    })

    describe('if hasOldZeroFeeManagement: false', () => {
      it('should return default values if there are no data', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: [],
          hasOldZeroFeeManagement: false,
        })

        expect(result).toEqual({
          subscriptions: {},
          metadata: { hasAnyFeeParsed: false, hasAnyPositiveFeeParsed: false },
        })
      })
      it('should return default values if there are no fees', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: noFees as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: false,
        })

        expect(result).toEqual(newNoFeesResult)
      })
      it('should return default values if there are only sub fee with 0 amountCents', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: subZeroAmount as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: false,
        })

        expect(result).toEqual(subZeroAmountResult)
      })
      it('should return default values if there are only sub fee with 0 amountCents and 0 units', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: chargeZeroAmount as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: false,
        })

        expect(result).toEqual(chargeZeroAmountResult)
      })
      it('should return all values if invoice has draft status', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions:
            chargeZeroAmountDraftInvoice as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: false,
        })

        expect(result).toEqual(newChargeZeroAmountDraftInvoiceResult)
      })
      it('should return the correct values if there are 1 subscription', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: oneSubscription as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: false,
        })

        expect(result).toEqual(oneSubscriptionResult)
      })
      it('should return the correct values if there are 2 subscription', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions: twoSubscriptions as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: false,
        })

        expect(result).toEqual(twoSubscriptionsResult)
      })
      it('should return the correct order for a given subscription', () => {
        const result = groupAndFormatFees({
          invoiceSubscriptions:
            unorderedSubscriptionWithFees as unknown as InvoiceSubscriptionsForDisplay,
          hasOldZeroFeeManagement: false,
        })

        expect(result).toEqual(newOrderedSubscriptionWithFees)
      })
    })
  })

  describe('composeChargeFilterDisplayName', () => {
    it('should return empty string if there are no values', () => {
      const result = composeChargeFilterDisplayName()

      expect(result).toEqual('')
    })

    it('should return empty string if value passed is null', () => {
      const result = composeChargeFilterDisplayName(null)

      expect(result).toEqual('')
    })

    it('should return data correctly formated', () => {
      const result = composeChargeFilterDisplayName({
        id: 'id',
        invoiceDisplayName: null,
        values: {
          key1: ['value1', 'value2'],
          key2: [ALL_FILTER_VALUES],
        },
      })

      expect(result).toEqual('value1 • value2 • key2')
    })

    it('should return invoiceDisplayName is present', () => {
      const result = composeChargeFilterDisplayName({
        id: 'id',
        invoiceDisplayName: 'This is my custom display name',
        values: {
          key1: ['value1', 'value2'],
          key2: [ALL_FILTER_VALUES],
        },
      })

      expect(result).toEqual('This is my custom display name')
    })
  })

  describe('composeGroupedByDisplayName', () => {
    it('should return empty string if there are no values', () => {
      const result = composeGroupedByDisplayName()

      expect(result).toEqual('')
    })

    it('should return empty string if value passed is null', () => {
      const result = composeGroupedByDisplayName(null)

      expect(result).toEqual('')
    })

    it('should return data correctly formated', () => {
      const result = composeGroupedByDisplayName({
        toto: 'value1',
        tata: 'value2',
      })

      expect(result).toEqual('value1 • value2')
    })
  })

  describe('composeMultipleValuesWithSepator', () => {
    it('should return empty string if there are no values', () => {
      const result = composeMultipleValuesWithSepator()

      expect(result).toEqual('')
    })

    it('should return empty string if value passed is an empty array', () => {
      const result = composeMultipleValuesWithSepator([])

      expect(result).toEqual('')
    })

    it('should return data correctly formated', () => {
      const result = composeMultipleValuesWithSepator([
        'value1',
        'value2',
        'key2',
        null,
        undefined,
        composeMultipleValuesWithSepator(['toto', null, undefined, 'tata']),
      ])

      expect(result).toEqual('value1 • value2 • key2 • toto • tata')
    })
  })

  describe('_newDeepFormatFees', () => {
    describe('Subscription fees', () => {
      it('should format subscription fee with custom display name', () => {
        const fee = {
          id: 'fee-sub',
          feeType: FeeTypesEnum.Subscription,
          invoiceDisplayName: 'Custom Subscription Name',
          subscription: {
            plan: {
              name: 'Plan name',
              interval: 'monthly',
            },
          },
          amountCents: 5000,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isSubscriptionFee: true,
          displayName: 'Custom Subscription Name',
        })
      })

      it('should format subscription fee with generated display name', () => {
        const fee = {
          id: 'fee-sub',
          feeType: FeeTypesEnum.Subscription,
          invoiceDisplayName: null,
          subscription: {
            plan: {
              name: 'Premium Plan',
              interval: 'yearly',
            },
          },
          amountCents: 5000,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isSubscriptionFee: true,
          displayName: 'Yearly subscription fee - Premium Plan',
        })
      })
    })

    describe('Fixed charge fees', () => {
      it('should format fixed charge fee with invoiceName as display name', () => {
        const fee = {
          id: 'fee-1',
          feeType: FeeTypesEnum.FixedCharge,
          invoiceName: 'Fixed Fee Invoice Name',
          itemName: 'Fixed Fee Item Name',
          amountCents: 1000,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isFixedCharge: true,
          displayName: 'Fixed Fee Invoice Name',
        })
      })

      it('should format fixed charge fee with itemName as fallback display name', () => {
        const fee = {
          id: 'fee-1',
          feeType: FeeTypesEnum.FixedCharge,
          invoiceName: null,
          itemName: 'Fixed Fee Item Name',
          amountCents: 1000,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isFixedCharge: true,
          displayName: 'Fixed Fee Item Name',
        })
      })
    })

    describe('Commitment fees', () => {
      it('should format commitment fee with custom display name', () => {
        const fee = {
          id: 'fee-commitment',
          feeType: FeeTypesEnum.Commitment,
          invoiceDisplayName: 'Custom Commitment Display',
          amountCents: 2000,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isCommitmentFee: true,
          displayName: 'Custom Commitment Display',
        })
      })

      it('should format commitment fee with default display name', () => {
        const fee = {
          id: 'fee-commitment',
          feeType: FeeTypesEnum.Commitment,
          invoiceDisplayName: null,
          amountCents: 2000,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isCommitmentFee: true,
          displayName: 'Minimum commitment - True up',
        })
      })
    })

    describe('True-up fees', () => {
      it('should format true-up fee with all components', () => {
        const fee = {
          id: 'fee-trueup',
          feeType: FeeTypesEnum.Charge,
          invoiceName: 'API Calls',
          trueUpParentFee: { id: 'parent-fee-id' },
          groupedBy: { region: 'US-East' },
          chargeFilter: {
            id: 'filter-id',
            invoiceDisplayName: null,
            values: { tier: ['premium'] },
          },
          charge: {
            id: 'charge-id',
            payInAdvance: false,
            invoiceDisplayName: null,
            chargeModel: ChargeModelEnum.Standard,
            minAmountCents: 0,
            prorated: false,
            billableMetric: {
              id: 'bm-id',
              name: 'API Calls Metric',
              aggregationType: AggregationTypeEnum.CountAgg,
              recurring: false,
            },
          },
          amountCents: 1500,
          units: 1,
          itemName: 'API Calls',
          preciseUnitAmount: 1,
          adjustedFee: false,
          currency: CurrencyEnum.Usd,
        } as unknown as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata.isTrueUpFee).toBe(true)
        expect(result[0].metadata.displayName).toBe('API Calls • US-East • premium - True-up')
        expect(result[0].trueUpParentFee?.id).toBe('parent-fee-id')
      })

      it('should format true-up fee using billable metric name as fallback', () => {
        const fee = {
          id: 'fee-trueup',
          feeType: FeeTypesEnum.Charge,
          invoiceName: null,
          trueUpParentFee: { id: 'parent-fee-id' },
          charge: {
            billableMetric: {
              name: 'Bandwidth Usage',
            },
          },
          amountCents: 1500,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata.isTrueUpFee).toBe(true)
        expect(result[0].metadata.displayName).toBe('Bandwidth Usage - True-up')
        expect(result[0].trueUpParentFee?.id).toBe('parent-fee-id')
      })

      it('should NOT mark fee as true-up when trueUpParentFee is null', () => {
        const fee = {
          id: 'fee-normal',
          feeType: FeeTypesEnum.Charge,
          invoiceName: 'Normal Charge',
          trueUpParentFee: null,
          charge: {
            id: 'charge-id',
            payInAdvance: false,
            invoiceDisplayName: null,
            chargeModel: ChargeModelEnum.Standard,
            minAmountCents: 0,
            prorated: false,
            billableMetric: {
              id: 'bm-id',
              name: 'Normal Metric',
              aggregationType: AggregationTypeEnum.CountAgg,
              recurring: false,
            },
          },
          amountCents: 2000,
          units: 1,
          groupedBy: {},
          itemName: 'Normal Charge',
          preciseUnitAmount: 1,
          adjustedFee: false,
          currency: CurrencyEnum.Usd,
        } as unknown as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata.isTrueUpFee).toBeUndefined()
        expect(result[0].metadata.isNormalFee).toBe(true)
        expect(result[0].metadata.displayName).toBe('Normal Charge')
        expect(result[0].trueUpParentFee).toBeNull()
      })

      it('should NOT mark fee as true-up when trueUpParentFee is undefined', () => {
        const fee = {
          id: 'fee-normal',
          feeType: FeeTypesEnum.Charge,
          invoiceName: 'Normal Charge',
          charge: {
            id: 'charge-id',
            payInAdvance: false,
            invoiceDisplayName: null,
            chargeModel: ChargeModelEnum.Standard,
            minAmountCents: 0,
            prorated: false,
            billableMetric: {
              id: 'bm-id',
              name: 'Normal Metric',
              aggregationType: AggregationTypeEnum.CountAgg,
              recurring: false,
            },
          },
          amountCents: 2000,
          units: 1,
          groupedBy: {},
          itemName: 'Normal Charge',
          preciseUnitAmount: 1,
          adjustedFee: false,
          currency: CurrencyEnum.Usd,
        } as unknown as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata.isTrueUpFee).toBeUndefined()
        expect(result[0].metadata.isNormalFee).toBe(true)
        expect(result[0].metadata.displayName).toBe('Normal Charge')
        expect(result[0].trueUpParentFee).toBeUndefined()
      })
    })

    describe('Filter child fees', () => {
      it('should format filter child fee with custom invoiceDisplayName', () => {
        const fee = {
          id: 'fee-filter',
          feeType: FeeTypesEnum.Charge,
          invoiceDisplayName: 'Custom Filter Display',
          chargeFilter: {
            id: 'filter-id',
            invoiceDisplayName: 'Filter Display Name',
            values: { type: ['basic'] },
          },
          amountCents: 800,
          units: 1,
          groupedBy: {},
          itemName: 'Filter Fee',
          preciseUnitAmount: 1,
          adjustedFee: false,
          currency: CurrencyEnum.Usd,
        } as unknown as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isFilterChildFee: true,
          displayName: 'Custom Filter Display',
        })
      })

      it('should format filter child fee with composed display name', () => {
        const fee = {
          id: 'fee-filter',
          feeType: FeeTypesEnum.Charge,
          invoiceDisplayName: null,
          invoiceName: 'Storage Usage',
          groupedBy: { datacenter: 'DC1' },
          chargeFilter: {
            id: 'filter-id',
            invoiceDisplayName: null,
            values: { storage_type: ['ssd', 'nvme'] },
          },
          charge: {
            id: 'charge-id',
            payInAdvance: false,
            invoiceDisplayName: null,
            chargeModel: ChargeModelEnum.Standard,
            minAmountCents: 0,
            prorated: false,
            billableMetric: {
              id: 'bm-id',
              name: 'Storage Metric',
              aggregationType: AggregationTypeEnum.CountAgg,
              recurring: false,
            },
          },
          amountCents: 1200,
          units: 1,
          itemName: 'Storage Usage',
          preciseUnitAmount: 1,
          adjustedFee: false,
          currency: CurrencyEnum.Usd,
        } as unknown as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata.isFilterChildFee).toBe(true)
        expect(result[0].metadata.displayName).toBe('Storage Usage • DC1 • ssd • nvme')
      })
    })

    describe('Normal fees', () => {
      it('should format normal fee with invoiceDisplayName', () => {
        const fee = {
          id: 'fee-normal',
          feeType: FeeTypesEnum.Charge,
          invoiceDisplayName: 'Custom Normal Display',
          invoiceName: 'Compute Usage',
          charge: {
            billableMetric: {
              name: 'Compute Metric',
            },
          },
          amountCents: 3000,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isNormalFee: true,
          displayName: 'Custom Normal Display',
        })
      })

      it('should format normal fee with invoiceName', () => {
        const fee = {
          id: 'fee-normal',
          feeType: FeeTypesEnum.Charge,
          invoiceDisplayName: null,
          invoiceName: 'Network Transfer',
          charge: {
            billableMetric: {
              name: 'Network Metric',
            },
          },
          amountCents: 2500,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isNormalFee: true,
          displayName: 'Network Transfer',
        })
      })

      it('should format normal fee with billable metric name as fallback', () => {
        const fee = {
          id: 'fee-normal',
          feeType: FeeTypesEnum.Charge,
          invoiceDisplayName: null,
          invoiceName: null,
          charge: {
            billableMetric: {
              name: 'Database Operations',
            },
          },
          amountCents: 1800,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata).toEqual({
          isNormalFee: true,
          displayName: 'Database Operations',
        })
      })

      it('should format normal fee with groupedBy values', () => {
        const fee = {
          id: 'fee-normal',
          feeType: FeeTypesEnum.Charge,
          invoiceDisplayName: null,
          invoiceName: 'Requests',
          groupedBy: { region: 'EU-West', environment: 'production' },
          charge: {
            billableMetric: {
              name: 'Request Count',
            },
          },
          amountCents: 2200,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fee])

        expect(result).toHaveLength(1)
        expect(result[0].metadata.isNormalFee).toBe(true)
        expect(result[0].metadata.displayName).toBe('Requests • EU-West • production')
      })
    })

    describe('Sorting and ordering', () => {
      it('should sort all fee types in correct order', () => {
        const subscriptionFee = {
          id: 'fee-sub',
          feeType: FeeTypesEnum.Subscription,
          invoiceDisplayName: 'Custom name',
          subscription: {
            plan: {
              name: 'Custom name',
              interval: 'monthly',
            },
          },
          amountCents: 5000,
        } as TExtendedRemainingFee

        const fixedChargeFee = {
          id: 'fee-fixed',
          feeType: FeeTypesEnum.FixedCharge,
          invoiceName: 'Custom name',
          amountCents: 1000,
        } as TExtendedRemainingFee

        const commitmentFee = {
          id: 'fee-commitment',
          feeType: FeeTypesEnum.Commitment,
          invoiceDisplayName: 'Custom name',
          amountCents: 2000,
        } as TExtendedRemainingFee

        const normalFee = {
          id: 'fee-normal',
          feeType: FeeTypesEnum.Charge,
          invoiceName: 'Custom name',
          charge: {
            billableMetric: {
              name: 'Custom name',
            },
          },
          amountCents: 3000,
        } as TExtendedRemainingFee

        const trueUpFee = {
          id: 'fee-trueup',
          feeType: FeeTypesEnum.Charge,
          invoiceName: 'Custom name',
          trueUpParentFee: { id: 'parent' },
          charge: {
            billableMetric: {
              name: 'Custom name',
            },
          },
          amountCents: 500,
        } as TExtendedRemainingFee

        const filterFee = {
          id: 'fee-filter',
          feeType: FeeTypesEnum.Charge,
          invoiceName: 'Custom name',
          chargeFilter: {
            id: 'filter',
            invoiceDisplayName: null,
            values: { key: ['value'] },
          },
          charge: {
            id: 'charge-id',
            payInAdvance: false,
            invoiceDisplayName: null,
            chargeModel: ChargeModelEnum.Standard,
            minAmountCents: 0,
            prorated: false,
            billableMetric: {
              id: 'bm-id',
              name: 'Custom name',
              aggregationType: AggregationTypeEnum.CountAgg,
              recurring: false,
            },
          },
          amountCents: 700,
          units: 1,
          groupedBy: {},
          itemName: 'Custom name',
          preciseUnitAmount: 1,
          adjustedFee: false,
          currency: CurrencyEnum.Usd,
        } as unknown as TExtendedRemainingFee

        // Test with fees in random order
        const result = _newDeepFormatFees([
          commitmentFee,
          normalFee,
          trueUpFee,
          fixedChargeFee,
          filterFee,
          subscriptionFee,
        ])

        expect(result).toHaveLength(6)
        // Subscription fees should always be first
        expect(result[0].metadata.isSubscriptionFee).toBe(true)
        // Fixed charge fees should always be second
        expect(result[1].metadata.isFixedCharge).toBe(true)
        // Normal, Filter, and True-up fees are sorted alphabetically within the middle group
        // "Custom name" < "Custom name - True-up" < "Custom name • value"
        expect(result[2].metadata.isNormalFee).toBe(true)
        expect(result[3].metadata.isTrueUpFee).toBe(true)
        expect(result[4].metadata.isFilterChildFee).toBe(true)
        // Commitment fees should always be last
        expect(result[5].metadata.isCommitmentFee).toBe(true)
      })

      it('should sort fees of same type alphabetically by display name', () => {
        const fixedChargeFeeZ = {
          id: 'fee-fixed-z',
          feeType: FeeTypesEnum.FixedCharge,
          invoiceName: 'Zebra Fixed Fee',
          amountCents: 1000,
        } as TExtendedRemainingFee

        const fixedChargeFeeA = {
          id: 'fee-fixed-a',
          feeType: FeeTypesEnum.FixedCharge,
          invoiceName: 'Apple Fixed Fee',
          amountCents: 2000,
        } as TExtendedRemainingFee

        const fixedChargeFeeM = {
          id: 'fee-fixed-m',
          feeType: FeeTypesEnum.FixedCharge,
          invoiceName: 'Mango Fixed Fee',
          amountCents: 1500,
        } as TExtendedRemainingFee

        const result = _newDeepFormatFees([fixedChargeFeeZ, fixedChargeFeeM, fixedChargeFeeA])

        expect(result).toHaveLength(3)
        expect(result[0].metadata.displayName).toBe('Apple Fixed Fee')
        expect(result[1].metadata.displayName).toBe('Mango Fixed Fee')
        expect(result[2].metadata.displayName).toBe('Zebra Fixed Fee')
      })
    })
  })
})
