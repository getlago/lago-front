import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  GetWalletInfosForWalletFormQuery,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { TWalletDataForm } from '~/pages/wallet/types'

import { mapFromApiToForm, WALLET_DEFAULT_PRIORITY } from '../mapFromApiToForm'
import { mapFormToCreateInput, mapFormToUpdateInput } from '../mapFromFormToApi'

const customerData = {
  customer: {
    id: 'customer-id',
    externalId: 'ext-id',
    currency: CurrencyEnum.Usd,
    timezone: null,
    billingEntity: { id: 'customer-billing-entity-id' },
  },
} as unknown as GetCustomerInfosForWalletFormQuery

const wallet = {
  id: 'wallet-id',
  billingEntityId: 'wallet-billing-entity-id',
  currency: CurrencyEnum.Usd,
  expirationAt: '2099-01-01T00:00:00Z',
  name: 'My wallet',
  rateAmount: '2',
  invoiceRequiresSuccessfulPayment: true,
  paidTopUpMinAmountCents: '1000',
  paidTopUpMaxAmountCents: '10000',
  priority: 10,
  paymentMethodType: 'provider',
  paymentMethod: { id: 'pm-id' },
  skipInvoiceCustomSections: false,
  selectedInvoiceCustomSections: [{ id: 'ics-id', name: 'Section' }],
  appliesTo: { feeTypes: ['charge'], billableMetrics: [{ id: 'bm-id' }] },
  recurringTransactionRules: [
    {
      lagoId: 'rule-lago-id',
      trigger: RecurringTransactionTriggerEnum.Interval,
      method: RecurringTransactionMethodEnum.Fixed,
      interval: RecurringTransactionIntervalEnum.Monthly,
      startedAt: '2024-01-01T00:00:00Z',
      expirationAt: null,
      paidCredits: '10',
      grantedCredits: '5',
      grantsTargetTopUp: null,
      targetOngoingBalance: null,
      thresholdCredits: null,
      transactionName: 'rule-tx',
      ignorePaidTopUpLimits: false,
      invoiceRequiresSuccessfulPayment: false,
      paymentMethodType: 'manual',
      paymentMethod: { id: 'rule-pm-id' },
      skipInvoiceCustomSections: true,
      selectedInvoiceCustomSections: [],
      transactionMetadata: [{ key: 'k', value: 'v' }],
    },
  ],
} as unknown as NonNullable<GetWalletInfosForWalletFormQuery['wallet']>

const baseForm = (overrides: Partial<TWalletDataForm> = {}): TWalletDataForm => ({
  currency: CurrencyEnum.Usd,
  billingEntityId: undefined,
  expirationAt: undefined,
  grantedCredits: '',
  name: 'My wallet',
  transactionName: undefined,
  appliesTo: { feeTypes: [], billableMetrics: [] },
  paidCredits: '',
  rateAmount: '1.00',
  recurringTransactionRules: undefined,
  invoiceRequiresSuccessfulPayment: false,
  paidTopUpMinAmountCents: undefined,
  paidTopUpMaxAmountCents: undefined,
  ignorePaidTopUpLimitsOnCreation: false,
  priority: 50,
  paymentMethod: { paymentMethodType: undefined, paymentMethodId: undefined },
  invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
  ...overrides,
})

describe('mapFromApiToForm', () => {
  it('builds empty creation defaults when no wallet is given', () => {
    const values = mapFromApiToForm({
      wallet: undefined,
      customerData,
      currency: CurrencyEnum.Usd,
    })

    expect(values.currency).toBe(CurrencyEnum.Usd)
    expect(values.billingEntityId).toBe('customer-billing-entity-id')
    expect(values.name).toBe('')
    expect(values.grantedCredits).toBe('')
    expect(values.paidCredits).toBe('')
    expect(values.rateAmount).toBe('1.00')
    expect(values.recurringTransactionRules).toBeUndefined()
    expect(values.invoiceRequiresSuccessfulPayment).toBe(false)
    expect(values.paidTopUpMinAmountCents).toBeUndefined()
    expect(values.paidTopUpMaxAmountCents).toBeUndefined()
    expect(values.ignorePaidTopUpLimitsOnCreation).toBe(false)
    expect(values.priority).toBe(WALLET_DEFAULT_PRIORITY)
    expect(values.appliesTo).toEqual({ feeTypes: [], billableMetrics: [] })
  })

  it('prefills edition values from the wallet', () => {
    const values = mapFromApiToForm({ wallet, customerData, currency: CurrencyEnum.Usd })

    expect(values.billingEntityId).toBe('wallet-billing-entity-id')
    expect(values.name).toBe('My wallet')
    expect(values.expirationAt).toBe('2099-01-01T00:00:00Z')
    expect(values.rateAmount).toBe('2.00')
    // credits are create-only: always reset in the form
    expect(values.grantedCredits).toBe('')
    expect(values.paidCredits).toBe('')
    // min/max are deserialized from cents to display amount
    expect(values.paidTopUpMinAmountCents).toBe(10)
    expect(values.paidTopUpMaxAmountCents).toBe(100)
    expect(values.priority).toBe(10)
    expect(values.paymentMethod).toEqual({
      paymentMethodType: 'provider',
      paymentMethodId: 'pm-id',
    })
    expect(values.invoiceCustomSection).toEqual({
      invoiceCustomSections: [{ id: 'ics-id', name: 'Section' }],
      skipInvoiceCustomSections: false,
    })
  })

  it('transforms recurring rules (nested paymentMethod/invoiceCustomSection, query-only fields dropped)', () => {
    const values = mapFromApiToForm({ wallet, customerData, currency: CurrencyEnum.Usd })
    const rule = values.recurringTransactionRules?.[0]

    expect(rule?.paymentMethod).toEqual({
      paymentMethodType: 'manual',
      paymentMethodId: 'rule-pm-id',
    })
    expect(rule?.invoiceCustomSection).toEqual({
      invoiceCustomSections: [],
      skipInvoiceCustomSections: true,
    })
    expect(rule).not.toHaveProperty('paymentMethodType')
    expect(rule).not.toHaveProperty('selectedInvoiceCustomSections')
    expect(rule).not.toHaveProperty('skipInvoiceCustomSections')
  })
})

describe('mapFormToCreateInput', () => {
  it('serializes the creation input with defaults', () => {
    const input = mapFormToCreateInput(baseForm(), 'customer-id')

    expect(input.customerId).toBe('customer-id')
    expect(input.currency).toBe(CurrencyEnum.Usd)
    expect(input.rateAmount).toBe('1.00')
    // '' credits become '0'
    expect(input.grantedCredits).toBe('0')
    expect(input.paidCredits).toBe('0')
    // billingEntityId: null (not undefined) = inherit from customer
    expect(input.billingEntityId).toBeNull()
    expect(input.priority).toBe(WALLET_DEFAULT_PRIORITY)
    expect(input.appliesTo).toEqual({ feeTypes: [], billableMetricIds: [] })
    expect(input.recurringTransactionRules).toEqual([])
    // create leaves min/max undefined when falsy (dropped on the wire),
    // unlike update which sends an explicit null to clear the stored value
    expect(input.paidTopUpMinAmountCents).toBeUndefined()
    expect(input.paidTopUpMaxAmountCents).toBeUndefined()
  })

  it('serializes min/max amounts to cents when set', () => {
    const input = mapFormToCreateInput(
      baseForm({ paidTopUpMinAmountCents: 123.45, paidTopUpMaxAmountCents: 500 }),
      'customer-id',
    )

    expect(input.paidTopUpMinAmountCents).toBe(serializeAmount(123.45, CurrencyEnum.Usd))
    expect(input.paidTopUpMaxAmountCents).toBe(serializeAmount(500, CurrencyEnum.Usd))
  })

  it('formats appliesTo billableMetrics to ids', () => {
    const input = mapFormToCreateInput(
      baseForm({
        appliesTo: {
          feeTypes: [],
          billableMetrics: [
            { id: 'bm-1', name: 'Metric 1', code: 'metric_1' },
            { id: 'bm-2', name: 'Metric 2', code: 'metric_2' },
          ],
        },
      }),
      'customer-id',
    )

    expect(input.appliesTo).toEqual({ feeTypes: [], billableMetricIds: ['bm-1', 'bm-2'] })
  })

  it('formats Interval rules: threshold nulled, startedAt defaulted, credits zeroed, no lagoId', () => {
    const input = mapFormToCreateInput(
      baseForm({
        recurringTransactionRules: [
          {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Fixed,
            interval: RecurringTransactionIntervalEnum.Monthly,
            paidCredits: '',
            grantedCredits: '5',
            thresholdCredits: '999',
            expirationAt: '',
          },
        ] as TWalletDataForm['recurringTransactionRules'],
      }),
      'customer-id',
    )
    const rule = input.recurringTransactionRules?.[0]

    expect(rule?.interval).toBe(RecurringTransactionIntervalEnum.Monthly)
    expect(rule?.thresholdCredits).toBeNull()
    expect(rule?.startedAt).toEqual(expect.any(String))
    expect(rule?.paidCredits).toBe('0')
    expect(rule?.grantedCredits).toBe('5')
    expect(rule?.grantsTargetTopUp).toBeNull()
    expect(rule?.expirationAt).toBeNull()
    expect((rule as { lagoId?: string })?.lagoId).toBeUndefined()
  })

  it('formats Threshold + Target rules: interval/startedAt nulled, empty target becomes "0"', () => {
    const input = mapFormToCreateInput(
      baseForm({
        recurringTransactionRules: [
          {
            trigger: RecurringTransactionTriggerEnum.Threshold,
            method: RecurringTransactionMethodEnum.Target,
            interval: RecurringTransactionIntervalEnum.Monthly,
            thresholdCredits: '10',
            targetOngoingBalance: '',
            grantsTargetTopUp: true,
            paidCredits: '',
            grantedCredits: '',
          },
        ] as TWalletDataForm['recurringTransactionRules'],
      }),
      'customer-id',
    )
    const rule = input.recurringTransactionRules?.[0]

    expect(rule?.interval).toBeNull()
    expect(rule?.startedAt).toBeNull()
    expect(rule?.thresholdCredits).toBe('10')
    expect(rule?.targetOngoingBalance).toBe('0')
    expect(rule?.grantsTargetTopUp).toBe(true)
  })
})

describe('mapFormToUpdateInput', () => {
  it('excludes create-only fields and sends explicit nulls for cleared min/max', () => {
    const input = mapFormToUpdateInput(baseForm(), 'wallet-id')

    expect(input.id).toBe('wallet-id')
    // create-only fields never reach the update input
    expect(input).not.toHaveProperty('currency')
    expect(input).not.toHaveProperty('rateAmount')
    expect(input).not.toHaveProperty('grantedCredits')
    expect(input).not.toHaveProperty('paidCredits')
    expect(input).not.toHaveProperty('transactionName')
    expect(input).not.toHaveProperty('ignorePaidTopUpLimitsOnCreation')
    expect(input).not.toHaveProperty('customerId')
    // update sends explicit null (clears the stored value), unlike create
    expect(input.paidTopUpMinAmountCents).toBeNull()
    expect(input.paidTopUpMaxAmountCents).toBeNull()
    expect(input.billingEntityId).toBeNull()
    expect(input.priority).toBe(WALLET_DEFAULT_PRIORITY)
  })

  it('serializes min/max with the form currency when set', () => {
    const input = mapFormToUpdateInput(
      baseForm({ paidTopUpMinAmountCents: 10, paidTopUpMaxAmountCents: 100 }),
      'wallet-id',
    )

    expect(input.paidTopUpMinAmountCents).toBe(serializeAmount(10, CurrencyEnum.Usd))
    expect(input.paidTopUpMaxAmountCents).toBe(serializeAmount(100, CurrencyEnum.Usd))
  })

  it('carries the rule lagoId on edition', () => {
    const input = mapFormToUpdateInput(
      baseForm({
        recurringTransactionRules: [
          {
            lagoId: 'rule-lago-id',
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Fixed,
            interval: RecurringTransactionIntervalEnum.Weekly,
            startedAt: '2024-01-01T00:00:00Z',
            paidCredits: '10',
            grantedCredits: '',
          },
        ] as TWalletDataForm['recurringTransactionRules'],
      }),
      'wallet-id',
    )

    expect(input.recurringTransactionRules?.[0]?.lagoId).toBe('rule-lago-id')
    expect(input.recurringTransactionRules?.[0]?.startedAt).toBe('2024-01-01T00:00:00Z')
  })
})

describe('currency precision (non-2-decimal currencies)', () => {
  it('formats the default rateAmount without decimals for JPY (0-decimal)', () => {
    const values = mapFromApiToForm({
      wallet: undefined,
      customerData,
      currency: CurrencyEnum.Jpy,
    })

    expect(values.rateAmount).toBe('1')
  })

  it('deserializes JPY min/max bounds without dividing by 100', () => {
    const values = mapFromApiToForm({
      wallet: {
        ...wallet,
        currency: CurrencyEnum.Jpy,
        paidTopUpMinAmountCents: '1000',
        paidTopUpMaxAmountCents: '10000',
      } as unknown as NonNullable<GetWalletInfosForWalletFormQuery['wallet']>,
      customerData,
      currency: CurrencyEnum.Jpy,
    })

    // JPY has 0 decimals: "cents" are whole units
    expect(values.paidTopUpMinAmountCents).toBe(1000)
    expect(values.paidTopUpMaxAmountCents).toBe(10000)
  })

  it('serializes JPY min/max bounds back without multiplying by 100', () => {
    const input = mapFormToCreateInput(
      baseForm({
        currency: CurrencyEnum.Jpy,
        paidTopUpMinAmountCents: 1000,
        paidTopUpMaxAmountCents: 10000,
      }),
      'customer-id',
    )

    expect(input.paidTopUpMinAmountCents).toBe(1000)
    expect(input.paidTopUpMaxAmountCents).toBe(10000)
  })

  it('serializes 3-decimal currencies (BHD) with a 1000 factor', () => {
    const input = mapFormToCreateInput(
      baseForm({ currency: CurrencyEnum.Bhd, paidTopUpMaxAmountCents: 12.345 }),
      'customer-id',
    )

    expect(input.paidTopUpMaxAmountCents).toBe(12345)
  })

  it('round-trips EUR amounts through deserialize/serialize', () => {
    const values = mapFromApiToForm({
      wallet: {
        ...wallet,
        currency: CurrencyEnum.Eur,
        paidTopUpMinAmountCents: '12345',
      } as unknown as NonNullable<GetWalletInfosForWalletFormQuery['wallet']>,
      customerData,
      currency: CurrencyEnum.Eur,
    })

    expect(values.paidTopUpMinAmountCents).toBe(123.45)

    const input = mapFormToUpdateInput(
      baseForm({ currency: CurrencyEnum.Eur, paidTopUpMinAmountCents: 123.45 }),
      'wallet-id',
    )

    expect(input.paidTopUpMinAmountCents).toBe(12345)
  })
})
