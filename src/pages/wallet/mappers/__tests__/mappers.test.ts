import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  ConnectionBehaviorEnum,
  ConnectionCategoryEnum,
  ConnectionResolvedBehaviorEnum,
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  GetWalletInfosForWalletFormQuery,
  PaymentMethodTypeEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { TWalletDataForm, TWalletRecurringRule } from '~/pages/wallet/types'

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
  code: '',
  transactionName: undefined,
  appliesTo: { feeTypes: [], billableMetrics: [] },
  paidCredits: '',
  rateAmount: '1.00',
  recurringTransactionRules: undefined,
  invoiceRequiresSuccessfulPayment: false,
  paidTopUpMinAmountCents: undefined,
  paidTopUpMaxAmountCents: undefined,
  ignorePaidTopUpLimitsOnCreation: false,
  priority: '50',
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
    expect(values.priority).toBe(String(WALLET_DEFAULT_PRIORITY))
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
    expect(values.priority).toBe('10')
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
    const input = mapFormToCreateInput(baseForm(), 'customer-id', true)

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
      true,
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
      true,
    )

    expect(input.appliesTo).toEqual({ feeTypes: [], billableMetricIds: ['bm-1', 'bm-2'] })
  })

  it('formats Interval rules: threshold nulled, startedAt left null when unset, credits zeroed, no lagoId', () => {
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
      true,
    )
    const rule = input.recurringTransactionRules?.[0]

    expect(rule?.interval).toBe(RecurringTransactionIntervalEnum.Monthly)
    expect(rule?.thresholdCredits).toBeNull()
    // No explicit start date → null, so the backend keeps anchoring the
    // recurrence to the wallet's createdAt instead of today.
    expect(rule?.startedAt).toBeNull()
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
      true,
    )
    const rule = input.recurringTransactionRules?.[0]

    expect(rule?.interval).toBeNull()
    expect(rule?.startedAt).toBeNull()
    expect(rule?.thresholdCredits).toBe('10')
    expect(rule?.targetOngoingBalance).toBe('0')
    expect(rule?.grantsTargetTopUp).toBe(true)
  })

  // `null` (not `undefined`) on clear → BE erases the stored value.
  it('normalizes the wallet purchaseOrderNumber: trimmed when set, explicit null when cleared', () => {
    expect(
      mapFormToCreateInput(baseForm({ purchaseOrderNumber: '  PO-9  ' }), 'customer-id', true)
        .purchaseOrderNumber,
    ).toBe('PO-9')
    expect(
      mapFormToCreateInput(baseForm({ purchaseOrderNumber: '   ' }), 'customer-id', true)
        .purchaseOrderNumber,
    ).toBeNull()
    expect(mapFormToCreateInput(baseForm(), 'customer-id', true).purchaseOrderNumber).toBeNull()
  })

  it('normalizes the rule purchaseOrderNumber: trimmed when set, explicit null when cleared', () => {
    const buildRuleInput = (purchaseOrderNumber?: string) =>
      mapFormToCreateInput(
        baseForm({
          recurringTransactionRules: [
            {
              trigger: RecurringTransactionTriggerEnum.Interval,
              method: RecurringTransactionMethodEnum.Fixed,
              interval: RecurringTransactionIntervalEnum.Monthly,
              paidCredits: '10',
              grantedCredits: '',
              purchaseOrderNumber,
            },
          ] as TWalletDataForm['recurringTransactionRules'],
        }),
        'customer-id',
        true,
      ).recurringTransactionRules?.[0]

    expect(buildRuleInput('  PO-RULE  ')?.purchaseOrderNumber).toBe('PO-RULE')
    expect(buildRuleInput('')?.purchaseOrderNumber).toBeNull()
    expect(buildRuleInput(undefined)?.purchaseOrderNumber).toBeNull()
  })
})

describe('mapFormToUpdateInput', () => {
  it('excludes create-only fields and sends explicit nulls for cleared min/max', () => {
    const input = mapFormToUpdateInput(baseForm(), 'wallet-id', true)

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
      true,
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
      true,
    )

    expect(input.recurringTransactionRules?.[0]?.lagoId).toBe('rule-lago-id')
    expect(input.recurringTransactionRules?.[0]?.startedAt).toBe('2024-01-01T00:00:00Z')
  })

  // `null` (not `undefined`) on clear → BE erases the stored value.
  it('normalizes the wallet purchaseOrderNumber: trimmed when set, explicit null when cleared', () => {
    expect(
      mapFormToUpdateInput(baseForm({ purchaseOrderNumber: '  PO-9  ' }), 'wallet-id', true)
        .purchaseOrderNumber,
    ).toBe('PO-9')
    expect(
      mapFormToUpdateInput(baseForm({ purchaseOrderNumber: '' }), 'wallet-id', true)
        .purchaseOrderNumber,
    ).toBeNull()
    expect(mapFormToUpdateInput(baseForm(), 'wallet-id', true).purchaseOrderNumber).toBeNull()
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
      true,
    )

    expect(input.paidTopUpMinAmountCents).toBe(1000)
    expect(input.paidTopUpMaxAmountCents).toBe(10000)
  })

  it('serializes 3-decimal currencies (BHD) with a 1000 factor', () => {
    const input = mapFormToCreateInput(
      baseForm({ currency: CurrencyEnum.Bhd, paidTopUpMaxAmountCents: 12.345 }),
      'customer-id',
      true,
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
      true,
    )

    expect(input.paidTopUpMinAmountCents).toBe(12345)
  })
})

describe('connections payload', () => {
  it('omits connections entirely when the connection drawer was never saved', () => {
    expect(mapFormToCreateInput(baseForm(), 'customer-id', true)).not.toHaveProperty('connections')
    expect(mapFormToUpdateInput(baseForm(), 'wallet-id', true)).not.toHaveProperty('connections')
  })

  it('sends the wallet payment connection on both create and update', () => {
    const form = baseForm({ paymentConnection: { code: 'stripe_eu' } })

    expect(mapFormToCreateInput(form, 'customer-id', true).connections).toEqual({
      payment: { code: 'stripe_eu' },
    })
    expect(mapFormToUpdateInput(form, 'wallet-id', true).connections).toEqual({
      payment: { code: 'stripe_eu' },
    })
  })

  it('keeps each recurring rule connection independent from the wallet one', () => {
    const input = mapFormToCreateInput(
      baseForm({
        paymentConnection: { behavior: ConnectionBehaviorEnum.Skip },
        recurringTransactionRules: [
          {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Fixed,
            interval: RecurringTransactionIntervalEnum.Monthly,
            paidCredits: '1',
            grantedCredits: '1',
            paymentConnection: { code: 'adyen_global' },
          },
        ] as TWalletDataForm['recurringTransactionRules'],
      }),
      'customer-id',
      true,
    )

    expect(input.connections).toEqual({ payment: { behavior: ConnectionBehaviorEnum.Skip } })
    expect(input.recurringTransactionRules?.[0]?.connections).toEqual({
      payment: { code: 'adyen_global' },
    })
  })

  it('omits connections on a rule whose connection was never saved', () => {
    const input = mapFormToCreateInput(
      baseForm({
        recurringTransactionRules: [
          {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Fixed,
            interval: RecurringTransactionIntervalEnum.Monthly,
            paidCredits: '1',
            grantedCredits: '1',
          },
        ] as TWalletDataForm['recurringTransactionRules'],
      }),
      'customer-id',
      true,
    )

    expect(input.recurringTransactionRules?.[0]).not.toHaveProperty('connections')
  })

  // An omitted category keeps whatever the backend stored, so a category the user never
  // opened must not appear — `inherit` would erase an existing override row.
  it.each([
    ['accountingConnection', 'accounting'],
    ['crmConnection', 'crm'],
    ['taxConnection', 'tax'],
  ])('sends %s alone when it is the only touched category', (field, key) => {
    const form = baseForm({ [field]: { code: 'connection_code' } } as Partial<TWalletDataForm>)

    expect(mapFormToCreateInput(form, 'customer-id', true).connections).toEqual({
      [key]: { code: 'connection_code' },
    })
    expect(mapFormToUpdateInput(form, 'wallet-id', true).connections).toEqual({
      [key]: { code: 'connection_code' },
    })
  })

  it('sends every touched category in one payload on both create and update', () => {
    const form = baseForm({
      paymentConnection: { code: 'stripe_eu' },
      accountingConnection: { code: 'netsuite_eu' },
      crmConnection: { behavior: ConnectionBehaviorEnum.Skip },
      taxConnection: { behavior: ConnectionBehaviorEnum.Inherit },
    })

    const expected = {
      payment: { code: 'stripe_eu' },
      accounting: { code: 'netsuite_eu' },
      crm: { behavior: ConnectionBehaviorEnum.Skip },
      tax: { behavior: ConnectionBehaviorEnum.Inherit },
    }

    expect(mapFormToCreateInput(form, 'customer-id', true).connections).toEqual(expected)
    expect(mapFormToUpdateInput(form, 'wallet-id', true).connections).toEqual(expected)
  })

  it('leaves the untouched categories out of the payload', () => {
    const connections = mapFormToCreateInput(
      baseForm({ accountingConnection: { code: 'netsuite_eu' } }),
      'customer-id',
      true,
    ).connections

    expect(connections).not.toHaveProperty('payment')
    expect(connections).not.toHaveProperty('crm')
    expect(connections).not.toHaveProperty('tax')
  })

  it('keeps each recurring rule integration connection independent from the wallet one', () => {
    const input = mapFormToCreateInput(
      baseForm({
        accountingConnection: { code: 'netsuite_wallet' },
        taxConnection: { behavior: ConnectionBehaviorEnum.Skip },
        recurringTransactionRules: [
          {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Fixed,
            interval: RecurringTransactionIntervalEnum.Monthly,
            paidCredits: '1',
            grantedCredits: '1',
            accountingConnection: { behavior: ConnectionBehaviorEnum.Skip },
            crmConnection: { code: 'hubspot_rule' },
          },
        ] as TWalletDataForm['recurringTransactionRules'],
      }),
      'customer-id',
      true,
    )

    expect(input.connections).toEqual({
      accounting: { code: 'netsuite_wallet' },
      tax: { behavior: ConnectionBehaviorEnum.Skip },
    })
    expect(input.recurringTransactionRules?.[0]?.connections).toEqual({
      accounting: { behavior: ConnectionBehaviorEnum.Skip },
      crm: { code: 'hubspot_rule' },
    })
  })

  // The FE-shaped fields are consumed by formatConnections; leaking them raw would be
  // rejected by the recurring-rule input.
  it('never leaks the form-shaped connection fields onto a rule', () => {
    const rule = mapFormToCreateInput(
      baseForm({
        recurringTransactionRules: [
          {
            trigger: RecurringTransactionTriggerEnum.Interval,
            method: RecurringTransactionMethodEnum.Fixed,
            interval: RecurringTransactionIntervalEnum.Monthly,
            paidCredits: '1',
            grantedCredits: '1',
            accountingConnection: { code: 'netsuite_eu' },
            crmConnection: { code: 'hubspot_main' },
            taxConnection: { code: 'anrok_eu' },
          },
        ] as TWalletDataForm['recurringTransactionRules'],
      }),
      'customer-id',
      true,
    ).recurringTransactionRules?.[0]

    expect(rule).not.toHaveProperty('accountingConnection')
    expect(rule).not.toHaveProperty('crmConnection')
    expect(rule).not.toHaveProperty('taxConnection')
  })
})

describe('connections read-back', () => {
  const routing = (
    category: ConnectionCategoryEnum,
    behavior: ConnectionResolvedBehaviorEnum,
    code?: string,
  ) => ({ category, behavior, code })

  const walletWithRouting = (
    connections: ReturnType<typeof routing>[],
    ruleConnections: ReturnType<typeof routing>[] = [],
  ) =>
    ({
      ...wallet,
      connections,
      recurringTransactionRules: [
        { ...wallet.recurringTransactionRules?.[0], connections: ruleConnections },
      ],
    }) as unknown as NonNullable<GetWalletInfosForWalletFormQuery['wallet']>

  it('seeds each category field from its own routing row', () => {
    const values = mapFromApiToForm({
      wallet: walletWithRouting([
        routing(
          ConnectionCategoryEnum.Payment,
          ConnectionResolvedBehaviorEnum.Specific,
          'stripe_eu',
        ),
        routing(
          ConnectionCategoryEnum.Accounting,
          ConnectionResolvedBehaviorEnum.Specific,
          'netsuite_eu',
        ),
        routing(ConnectionCategoryEnum.Crm, ConnectionResolvedBehaviorEnum.Skip),
        routing(ConnectionCategoryEnum.Tax, ConnectionResolvedBehaviorEnum.Specific, 'anrok_eu'),
      ]),
      customerData,
      currency: CurrencyEnum.Usd,
    })

    expect(values.paymentConnection).toEqual({ code: 'stripe_eu' })
    expect(values.accountingConnection).toEqual({ code: 'netsuite_eu' })
    expect(values.crmConnection).toEqual({ behavior: ConnectionBehaviorEnum.Skip })
    expect(values.taxConnection).toEqual({ code: 'anrok_eu' })
  })

  // An `inherit` row carries the customer default's code: read back as an override it would
  // freeze the wallet onto a connection the user never picked.
  it.each([
    ['accountingConnection', ConnectionCategoryEnum.Accounting],
    ['crmConnection', ConnectionCategoryEnum.Crm],
    ['taxConnection', ConnectionCategoryEnum.Tax],
  ])('leaves %s untouched on an inherited row', (field, category) => {
    const values = mapFromApiToForm({
      wallet: walletWithRouting([
        routing(category, ConnectionResolvedBehaviorEnum.Inherit, 'customer_default'),
      ]),
      customerData,
      currency: CurrencyEnum.Usd,
    })

    expect(values[field as keyof TWalletDataForm]).toBeUndefined()
  })

  it('seeds the rule fields from the rule routing, independently of the wallet one', () => {
    const values = mapFromApiToForm({
      wallet: walletWithRouting(
        [
          routing(
            ConnectionCategoryEnum.Accounting,
            ConnectionResolvedBehaviorEnum.Specific,
            'netsuite_wallet',
          ),
        ],
        [
          routing(ConnectionCategoryEnum.Accounting, ConnectionResolvedBehaviorEnum.Skip),
          routing(
            ConnectionCategoryEnum.Crm,
            ConnectionResolvedBehaviorEnum.Specific,
            'hubspot_rule',
          ),
        ],
      ),
      customerData,
      currency: CurrencyEnum.Usd,
    })

    expect(values.accountingConnection).toEqual({ code: 'netsuite_wallet' })
    expect(values.recurringTransactionRules?.[0]?.accountingConnection).toEqual({
      behavior: ConnectionBehaviorEnum.Skip,
    })
    expect(values.recurringTransactionRules?.[0]?.crmConnection).toEqual({ code: 'hubspot_rule' })
    expect(values.recurringTransactionRules?.[0]?.taxConnection).toBeUndefined()
  })
})

describe('multi_connection disabled', () => {
  const formWithStoredRouting = () =>
    baseForm({
      paymentConnection: { code: 'stripe_eu' },
      taxConnection: { behavior: ConnectionBehaviorEnum.Skip },
      recurringTransactionRules: [
        {
          ...(baseForm().recurringTransactionRules?.[0] as TWalletRecurringRule),
          paymentConnection: { code: 'stripe_eu' },
        },
      ],
    })

  // `Wallets::{Create,Update}Service` refuses any payload carrying `connections` while the flag is
  // off, so a hydrated routing resent on an unrelated edit would fail every save.
  it.each([
    ['creation', () => mapFormToCreateInput(formWithStoredRouting(), 'customer-id', false)],
    ['edition', () => mapFormToUpdateInput(formWithStoredRouting(), 'wallet-id', false)],
  ])('omits connections from the %s payload, rules included', (_, run) => {
    const input = run()

    expect(input.connections).toBeUndefined()
    expect(input.recurringTransactionRules?.[0]?.connections).toBeUndefined()
  })

  it('still sends them once the flag is on', () => {
    const input = mapFormToUpdateInput(formWithStoredRouting(), 'wallet-id', true)

    expect(input.connections).toEqual({
      payment: { code: 'stripe_eu' },
      tax: { behavior: ConnectionBehaviorEnum.Skip },
    })
    expect(input.recurringTransactionRules?.[0]?.connections).toEqual({
      payment: { code: 'stripe_eu' },
    })
  })
})

describe('payment method read-back', () => {
  // A wallet saved with the customer default has `paymentMethod: null`. Left `undefined`, both
  // drawer schemas read it as an unfinished specific selection and refuse to submit.
  it('normalises an absent persisted method to null, on the wallet and on its rules', () => {
    const values = mapFromApiToForm({
      wallet: {
        ...wallet,
        paymentMethodType: PaymentMethodTypeEnum.Provider,
        paymentMethod: null,
        recurringTransactionRules: [
          { ...wallet.recurringTransactionRules?.[0], paymentMethod: null },
        ],
      } as unknown as NonNullable<GetWalletInfosForWalletFormQuery['wallet']>,
      customerData: undefined,
      currency: CurrencyEnum.Usd,
    })

    expect(values.paymentMethod?.paymentMethodId).toBeNull()
    expect(values.recurringTransactionRules?.[0]?.paymentMethod?.paymentMethodId).toBeNull()
  })
})
