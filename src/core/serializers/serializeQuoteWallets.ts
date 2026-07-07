import type { EntityData } from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import {
  CurrencyEnum,
  FeeTypesEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'

import { deserializeAmount, serializeAmount } from './serializeAmount'

// --- UI/form shape (camelCase) ---
export interface WalletRecurringRuleForm {
  trigger: RecurringTransactionTriggerEnum
  method: RecurringTransactionMethodEnum
  interval: RecurringTransactionIntervalEnum | null
  paidCredits: string
  grantedCredits: string
  targetOngoingBalance: string | null
  thresholdCredits: string | null
  startedAt: string | null
  transactionName: string | null
  invoiceRequiresSuccessfulPayment: boolean
  expirationAt: string | null
}

export interface WalletMetadataItem {
  key: string
  value: string
}

export interface WalletFormItem {
  localId: string
  name: string | null
  rateAmount: string
  priority: number
  expirationAt: string | null
  // Held in human currency units in the form; serialized to cents in overrides.
  paidTopUpMinAmountCents: string | null
  paidTopUpMaxAmountCents: string | null
  purchaseOrderNumber: string | null
  feeTypes: FeeTypesEnum[]
  billableMetricCodes: string[]
  freeCredits: string
  paidCredits: string
  invoiceRequiresSuccessfulPayment: boolean
  metadata: WalletMetadataItem[]
  recurringRule: WalletRecurringRuleForm | null
}

// --- Wire shape (snake_case), sent under `overrides` ---
export interface RecurringTransactionRuleOverride {
  trigger: string
  method: string
  interval: string | null
  paid_credits: string
  granted_credits: string
  target_ongoing_balance: string | null
  threshold_credits: string | null
  started_at: string | null
  transaction_name: string | null
  invoice_requires_successful_payment: boolean
  expiration_at: string | null
}

export interface WalletCreditOverrides {
  position: number
  name: string | null
  currency: string
  rate_amount: string
  paid_credits: string
  granted_credits: string
  expiration_at: string | null
  priority: number
  invoice_requires_successful_payment: boolean
  paid_top_up_min_amount_cents: number | null
  paid_top_up_max_amount_cents: number | null
  // ⚠️ backend key unconfirmed — flagged in the plan's Global Constraints.
  purchase_order_number: string | null
  metadata: WalletMetadataItem[]
  applies_to: { fee_types: string[]; billable_metric_codes: string[] }
  recurring_transaction_rules: RecurringTransactionRuleOverride[]
}

export interface BillingItemWallet {
  type: 'wallet_credit'
  localId: string
  overrides: WalletCreditOverrides
}

export const makeEmptyWalletItem = (localId: string): WalletFormItem => ({
  localId,
  name: null,
  rateAmount: '1',
  priority: 50,
  expirationAt: null,
  paidTopUpMinAmountCents: null,
  paidTopUpMaxAmountCents: null,
  purchaseOrderNumber: null,
  feeTypes: [],
  billableMetricCodes: [],
  freeCredits: '',
  paidCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  metadata: [],
  recurringRule: null,
})

const ruleToOverride = (rule: WalletRecurringRuleForm): RecurringTransactionRuleOverride => ({
  trigger: rule.trigger,
  method: rule.method,
  interval: rule.interval ?? null,
  paid_credits: rule.paidCredits || '0',
  granted_credits: rule.grantedCredits || '0',
  target_ongoing_balance: rule.targetOngoingBalance ?? null,
  threshold_credits: rule.thresholdCredits ?? null,
  started_at: rule.startedAt ?? null,
  transaction_name: rule.transactionName ?? null,
  invoice_requires_successful_payment: rule.invoiceRequiresSuccessfulPayment,
  expiration_at: rule.expirationAt ?? null,
})

const overrideToRule = (o: RecurringTransactionRuleOverride): WalletRecurringRuleForm => ({
  trigger: o.trigger as RecurringTransactionTriggerEnum,
  method: o.method as RecurringTransactionMethodEnum,
  interval: (o.interval as RecurringTransactionIntervalEnum) ?? null,
  paidCredits: o.paid_credits ?? '',
  grantedCredits: o.granted_credits ?? '',
  targetOngoingBalance: o.target_ongoing_balance ?? null,
  thresholdCredits: o.threshold_credits ?? null,
  startedAt: o.started_at ?? null,
  transactionName: o.transaction_name ?? null,
  invoiceRequiresSuccessfulPayment: !!o.invoice_requires_successful_payment,
  expirationAt: o.expiration_at ?? null,
})

export const toWallets = (items: WalletFormItem[], currency: CurrencyEnum): BillingItemWallet[] =>
  items.map((item, index) => {
    const overrides: WalletCreditOverrides = {
      position: index + 1,
      name: item.name || null,
      currency,
      rate_amount: item.rateAmount || '0',
      paid_credits: item.paidCredits || '0',
      granted_credits: item.freeCredits || '0',
      expiration_at: item.expirationAt ?? null,
      priority: item.priority,
      invoice_requires_successful_payment: item.invoiceRequiresSuccessfulPayment,
      paid_top_up_min_amount_cents:
        item.paidTopUpMinAmountCents !== null && item.paidTopUpMinAmountCents !== ''
          ? serializeAmount(Number(item.paidTopUpMinAmountCents), currency)
          : null,
      paid_top_up_max_amount_cents:
        item.paidTopUpMaxAmountCents !== null && item.paidTopUpMaxAmountCents !== ''
          ? serializeAmount(Number(item.paidTopUpMaxAmountCents), currency)
          : null,
      purchase_order_number: item.purchaseOrderNumber || null,
      metadata: item.metadata,
      applies_to: {
        fee_types: item.feeTypes,
        billable_metric_codes: item.billableMetricCodes,
      },
      recurring_transaction_rules: item.recurringRule ? [ruleToOverride(item.recurringRule)] : [],
    }

    return { type: 'wallet_credit' as const, localId: item.localId, overrides }
  })

export const fromWallets = (
  wallets: BillingItemWallet[],
): { entities: Record<string, EntityData>; walletItems: WalletFormItem[] } => {
  const entities: Record<string, EntityData> = {}
  const walletItems: WalletFormItem[] = []

  const sorted = [...wallets].sort((a, b) => a.overrides.position - b.overrides.position)

  for (const wallet of sorted) {
    const { overrides, localId: savedLocalId } = wallet
    const localId = savedLocalId ?? crypto.randomUUID()
    const currency = (overrides.currency as CurrencyEnum) ?? CurrencyEnum.Usd

    walletItems.push({
      localId,
      name: overrides.name ?? null,
      rateAmount: overrides.rate_amount ?? '1',
      priority: overrides.priority ?? 50,
      expirationAt: overrides.expiration_at ?? null,
      paidTopUpMinAmountCents:
        overrides.paid_top_up_min_amount_cents !== null &&
        overrides.paid_top_up_min_amount_cents !== undefined
          ? deserializeAmount(overrides.paid_top_up_min_amount_cents, currency).toString()
          : null,
      paidTopUpMaxAmountCents:
        overrides.paid_top_up_max_amount_cents !== null &&
        overrides.paid_top_up_max_amount_cents !== undefined
          ? deserializeAmount(overrides.paid_top_up_max_amount_cents, currency).toString()
          : null,
      purchaseOrderNumber: overrides.purchase_order_number ?? null,
      feeTypes: (overrides.applies_to?.fee_types ?? []) as FeeTypesEnum[],
      billableMetricCodes: overrides.applies_to?.billable_metric_codes ?? [],
      freeCredits: overrides.granted_credits ?? '',
      paidCredits: overrides.paid_credits ?? '',
      invoiceRequiresSuccessfulPayment: !!overrides.invoice_requires_successful_payment,
      metadata: overrides.metadata ?? [],
      recurringRule: overrides.recurring_transaction_rules?.[0]
        ? overrideToRule(overrides.recurring_transaction_rules[0])
        : null,
    })

    entities[localId] = {
      entityId: localId,
      entityType: 'wallet',
      name: overrides.name ?? '',
      code: '',
    }
  }

  return { entities, walletItems }
}
