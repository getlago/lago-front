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

// --- Wire shape (camelCase), sent under `payload` ---
export interface RecurringTransactionRulePayload {
  trigger: string
  method: string
  interval: string | null
  paidCredits: string
  grantedCredits: string
  targetOngoingBalance: string | null
  thresholdCredits: string | null
  startedAt: string | null
  transactionName: string | null
  invoiceRequiresSuccessfulPayment: boolean
  expirationAt: string | null
}

export interface WalletCreditPayload {
  position: number
  name: string | null
  currency: string
  rateAmount: string
  paidCredits: string
  grantedCredits: string
  expirationAt: string | null
  priority: number
  invoiceRequiresSuccessfulPayment: boolean
  paidTopUpMinAmountCents: number | null
  paidTopUpMaxAmountCents: number | null
  // ⚠️ backend key unconfirmed — flagged in the plan's Global Constraints.
  purchaseOrderNumber: string | null
  metadata: WalletMetadataItem[]
  appliesTo: { feeTypes: string[]; billableMetricCodes: string[] }
  recurringTransactionRules: RecurringTransactionRulePayload[]
}

export interface BillingItemWallet {
  type: 'wallet_credit'
  localId: string
  payload: WalletCreditPayload
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

const ruleToPayload = (rule: WalletRecurringRuleForm): RecurringTransactionRulePayload => ({
  trigger: rule.trigger,
  method: rule.method,
  interval: rule.interval ?? null,
  paidCredits: rule.paidCredits || '0',
  grantedCredits: rule.grantedCredits || '0',
  targetOngoingBalance: rule.targetOngoingBalance ?? null,
  thresholdCredits: rule.thresholdCredits ?? null,
  startedAt: rule.startedAt ?? null,
  transactionName: rule.transactionName ?? null,
  invoiceRequiresSuccessfulPayment: rule.invoiceRequiresSuccessfulPayment,
  expirationAt: rule.expirationAt ?? null,
})

const payloadToRule = (o: RecurringTransactionRulePayload): WalletRecurringRuleForm => ({
  trigger: o.trigger as RecurringTransactionTriggerEnum,
  method: o.method as RecurringTransactionMethodEnum,
  interval: (o.interval as RecurringTransactionIntervalEnum) ?? null,
  paidCredits: o.paidCredits ?? '',
  grantedCredits: o.grantedCredits ?? '',
  targetOngoingBalance: o.targetOngoingBalance ?? null,
  thresholdCredits: o.thresholdCredits ?? null,
  startedAt: o.startedAt ?? null,
  transactionName: o.transactionName ?? null,
  invoiceRequiresSuccessfulPayment: !!o.invoiceRequiresSuccessfulPayment,
  expirationAt: o.expirationAt ?? null,
})

export const toWallets = (items: WalletFormItem[], currency: CurrencyEnum): BillingItemWallet[] =>
  items.map((item, index) => {
    const payload: WalletCreditPayload = {
      position: index + 1,
      name: item.name || null,
      currency,
      rateAmount: item.rateAmount || '0',
      paidCredits: item.paidCredits || '0',
      grantedCredits: item.freeCredits || '0',
      expirationAt: item.expirationAt ?? null,
      priority: item.priority,
      invoiceRequiresSuccessfulPayment: item.invoiceRequiresSuccessfulPayment,
      paidTopUpMinAmountCents:
        item.paidTopUpMinAmountCents !== null && item.paidTopUpMinAmountCents !== ''
          ? serializeAmount(Number(item.paidTopUpMinAmountCents), currency)
          : null,
      paidTopUpMaxAmountCents:
        item.paidTopUpMaxAmountCents !== null && item.paidTopUpMaxAmountCents !== ''
          ? serializeAmount(Number(item.paidTopUpMaxAmountCents), currency)
          : null,
      purchaseOrderNumber: item.purchaseOrderNumber || null,
      metadata: item.metadata,
      appliesTo: {
        feeTypes: item.feeTypes,
        billableMetricCodes: item.billableMetricCodes,
      },
      recurringTransactionRules: item.recurringRule ? [ruleToPayload(item.recurringRule)] : [],
    }

    return { type: 'wallet_credit' as const, localId: item.localId, payload }
  })

export const fromWallets = (
  wallets: BillingItemWallet[],
): { entities: Record<string, EntityData>; walletItems: WalletFormItem[] } => {
  const entities: Record<string, EntityData> = {}
  const walletItems: WalletFormItem[] = []

  const sorted = [...wallets].sort((a, b) => a.payload.position - b.payload.position)

  for (const wallet of sorted) {
    const { payload, localId: savedLocalId } = wallet
    const localId = savedLocalId ?? crypto.randomUUID()
    const currency = (payload.currency as CurrencyEnum) ?? CurrencyEnum.Usd

    walletItems.push({
      localId,
      name: payload.name ?? null,
      rateAmount: payload.rateAmount ?? '1',
      priority: payload.priority ?? 50,
      expirationAt: payload.expirationAt ?? null,
      paidTopUpMinAmountCents:
        payload.paidTopUpMinAmountCents !== null && payload.paidTopUpMinAmountCents !== undefined
          ? deserializeAmount(payload.paidTopUpMinAmountCents, currency).toString()
          : null,
      paidTopUpMaxAmountCents:
        payload.paidTopUpMaxAmountCents !== null && payload.paidTopUpMaxAmountCents !== undefined
          ? deserializeAmount(payload.paidTopUpMaxAmountCents, currency).toString()
          : null,
      purchaseOrderNumber: payload.purchaseOrderNumber ?? null,
      feeTypes: (payload.appliesTo?.feeTypes ?? []) as FeeTypesEnum[],
      billableMetricCodes: payload.appliesTo?.billableMetricCodes ?? [],
      freeCredits: payload.grantedCredits ?? '',
      paidCredits: payload.paidCredits ?? '',
      invoiceRequiresSuccessfulPayment: !!payload.invoiceRequiresSuccessfulPayment,
      metadata: payload.metadata ?? [],
      recurringRule: payload.recurringTransactionRules?.[0]
        ? payloadToRule(payload.recurringTransactionRules[0])
        : null,
    })

    entities[localId] = {
      entityId: localId,
      entityType: 'wallet',
      name: payload.name ?? '',
      code: '',
    }
  }

  return { entities, walletItems }
}
