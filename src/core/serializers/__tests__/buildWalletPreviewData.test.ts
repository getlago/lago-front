import { buildWalletPreviewData } from '../buildWalletPreviewData'
import type { WalletCreditPayload } from '../serializeQuoteWallets'

const basePayload = (overrides: Partial<WalletCreditPayload> = {}): WalletCreditPayload => ({
  position: 0,
  name: 'Prepaid credits',
  currency: 'USD',
  rateAmount: '1',
  paidCredits: '0',
  grantedCredits: '0',
  expirationAt: null,
  priority: 50,
  invoiceRequiresSuccessfulPayment: false,
  paidTopUpMinAmountCents: null,
  paidTopUpMaxAmountCents: null,
  purchaseOrderNumber: null,
  metadata: [],
  appliesTo: { feeTypes: [], billableMetricCodes: [] },
  recurringTransactionRules: [],
  ...overrides,
})

describe('buildWalletPreviewData', () => {
  it('builds a paid row with price = credits × rate and marks it primary', () => {
    const data = buildWalletPreviewData(basePayload({ paidCredits: '100', rateAmount: '1.5' }))

    expect(data.name).toBe('Prepaid credits')
    expect(data.rows).toHaveLength(1)
    expect(data.rows[0]).toMatchObject({
      kind: 'paid',
      isPrimary: true,
      billed: { type: 'oneTime' },
      units: { type: 'count', value: 100 },
      price: { type: 'displayAmount', amount: '150' },
    })
  })

  it('builds a free row with a free price and no billing', () => {
    const data = buildWalletPreviewData(basePayload({ grantedCredits: '20' }))

    expect(data.rows).toHaveLength(1)
    expect(data.rows[0]).toMatchObject({
      kind: 'free',
      isPrimary: true,
      billed: { type: 'none' },
      units: { type: 'count', value: 20 },
      price: { type: 'free' },
    })
  })

  it('orders paid then free, marking only the paid row primary', () => {
    const data = buildWalletPreviewData(basePayload({ paidCredits: '100', grantedCredits: '20' }))

    expect(data.rows.map((r) => r.kind)).toEqual(['paid', 'free'])
    expect(data.rows[0].isPrimary).toBe(true)
    expect(data.rows[1].isPrimary).toBe(false)
  })

  it('builds one recurring row per rule, interval trigger + fixed method', () => {
    const data = buildWalletPreviewData(
      basePayload({
        recurringTransactionRules: [
          {
            trigger: 'interval',
            method: 'fixed',
            interval: 'monthly',
            paidCredits: '50',
            grantedCredits: '0',
            targetOngoingBalance: null,
            thresholdCredits: null,
            startedAt: null,
            transactionName: 'Monthly refill',
            invoiceRequiresSuccessfulPayment: false,
            expirationAt: null,
          },
        ],
      }),
    )

    expect(data.rows).toHaveLength(1)
    expect(data.rows[0]).toMatchObject({
      kind: 'recurring',
      transactionName: 'Monthly refill',
      billed: { type: 'interval', interval: 'monthly' },
      units: { type: 'count', value: 50 },
      price: { type: 'displayAmount', amount: '50' },
    })
  })

  it('emits two rows for a fixed rule funding both paid and granted credits', () => {
    const data = buildWalletPreviewData(
      basePayload({
        rateAmount: '2',
        recurringTransactionRules: [
          {
            trigger: 'interval',
            method: 'fixed',
            interval: 'monthly',
            paidCredits: '50',
            grantedCredits: '10',
            targetOngoingBalance: null,
            thresholdCredits: null,
            startedAt: null,
            transactionName: 'Monthly refill',
            invoiceRequiresSuccessfulPayment: false,
            expirationAt: null,
          },
        ],
      }),
    )

    expect(data.rows).toHaveLength(2)
    expect(data.rows[0]).toMatchObject({
      kind: 'recurring',
      transactionName: 'Monthly refill',
      billed: { type: 'interval', interval: 'monthly' },
      units: { type: 'count', value: 50 },
      price: { type: 'displayAmount', amount: '100' },
    })
    expect(data.rows[1]).toMatchObject({
      kind: 'recurring',
      transactionName: 'Monthly refill',
      billed: { type: 'interval', interval: 'monthly' },
      units: { type: 'count', value: 10 },
      price: { type: 'free' },
    })
  })

  it('maps a threshold trigger to a threshold billed descriptor', () => {
    const data = buildWalletPreviewData(
      basePayload({
        recurringTransactionRules: [
          {
            trigger: 'threshold',
            method: 'fixed',
            interval: null,
            paidCredits: '30',
            grantedCredits: '0',
            targetOngoingBalance: null,
            thresholdCredits: '10',
            startedAt: null,
            transactionName: null,
            invoiceRequiresSuccessfulPayment: false,
            expirationAt: null,
          },
        ],
      }),
    )

    expect(data.rows[0].billed).toEqual({ type: 'threshold' })
  })

  it('maps a target method to an "up to" unit and an empty price', () => {
    const data = buildWalletPreviewData(
      basePayload({
        recurringTransactionRules: [
          {
            trigger: 'interval',
            method: 'target',
            interval: 'weekly',
            paidCredits: '0',
            grantedCredits: '0',
            targetOngoingBalance: '200',
            thresholdCredits: null,
            startedAt: null,
            transactionName: null,
            invoiceRequiresSuccessfulPayment: false,
            expirationAt: null,
          },
        ],
      }),
    )

    expect(data.rows[0]).toMatchObject({
      units: { type: 'upTo', value: 200 },
      price: { type: 'empty' },
    })
  })

  it('carries expiration and scope through to the preview data', () => {
    const data = buildWalletPreviewData(
      basePayload({
        paidCredits: '100',
        expirationAt: '2026-09-16',
        appliesTo: { feeTypes: ['charge'], billableMetricCodes: ['api_calls'] },
      }),
    )

    expect(data.expirationAt).toBe('2026-09-16')
    expect(data.appliesTo).toEqual({ feeTypes: ['charge'], billableMetricCodes: ['api_calls'] })
  })

  it('returns no rows when the wallet has no credits and no rules', () => {
    const data = buildWalletPreviewData(basePayload())

    expect(data.rows).toHaveLength(0)
  })
})
