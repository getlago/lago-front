import { z } from 'zod'

import type {
  WalletFormItem,
  WalletMetadataItem,
  WalletRecurringRuleForm,
} from '~/core/serializers/serializeQuoteWallets'
import {
  FeeTypesEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'

// --- Slice value types ---
export interface WalletSettingsSlice {
  name: string
  rateAmount: string
  priority: number
  expirationAt: string | null
  paidTopUpMinAmountCents: string | null
  paidTopUpMaxAmountCents: string | null
  purchaseOrderNumber: string | null
}

export interface WalletScopeSlice {
  feeTypes: FeeTypesEnum[]
  billableMetricCodes: string[]
}

export interface WalletFreeAndPaidSlice {
  freeCredits: string
  paidCredits: string
  invoiceRequiresSuccessfulPayment: boolean
  metadata: WalletMetadataItem[]
}

export interface WalletRecurringSlice {
  enabled: boolean
  method: RecurringTransactionMethodEnum
  transactionName: string
  paidCredits: string
  grantedCredits: string
  invoiceRequiresSuccessfulPayment: boolean
  targetOngoingBalance: string
  trigger: RecurringTransactionTriggerEnum
  interval: RecurringTransactionIntervalEnum
  thresholdCredits: string
  startedAt: string | null
  expirationAt: string | null
}

// --- Pure numeric helpers (ported from src/pages/wallet/form.ts) ---
export const topUpWithinLimits = ({
  rateAmount,
  credits,
  min,
  max,
}: {
  rateAmount?: string
  credits?: string
  min?: string | null
  max?: string | null
}): boolean => {
  if (!rateAmount || credits === undefined || credits === '') return true
  if (Number(credits) === 0) return true

  const amount = Number(rateAmount) * Number(credits)
  const hasMin = min !== undefined && min !== null && min !== ''
  const hasMax = max !== undefined && max !== null && max !== ''

  if (hasMin && amount < Number(min)) return false
  if (hasMax && amount > Number(max)) return false

  return true
}

// --- Schemas ---
export const walletSettingsSchema = z
  .object({
    name: z.string(),
    rateAmount: z.string().min(1, 'text_624ea7c29103fd010732ab7d'),
    priority: z.number().min(1).max(50),
    expirationAt: z.string().nullable(),
    paidTopUpMinAmountCents: z.string().nullable(),
    paidTopUpMaxAmountCents: z.string().nullable(),
    purchaseOrderNumber: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (Number(data.rateAmount) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'text_624ea7c29103fd010732ab7d',
        path: ['rateAmount'],
      })
    }

    const min = data.paidTopUpMinAmountCents
    const max = data.paidTopUpMaxAmountCents

    if (min && max && Number(min) > Number(max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'text_175872290080132j1em37b08',
        path: ['paidTopUpMinAmountCents'],
      })
    }
  })

export const walletScopeSchema = z.object({
  feeTypes: z.array(z.nativeEnum(FeeTypesEnum)),
  billableMetricCodes: z.array(z.string()),
})

// Factory: free/paid amounts are validated against settings min/max (cross-slice).
export const walletFreeAndPaidSchema = (ctx: {
  rateAmount: string
  min: string | null
  max: string | null
}) =>
  z
    .object({
      freeCredits: z.string(),
      paidCredits: z.string(),
      invoiceRequiresSuccessfulPayment: z.boolean(),
      metadata: z.array(z.object({ key: z.string(), value: z.string() })),
    })
    .superRefine((data, issues) => {
      if (
        !topUpWithinLimits({
          rateAmount: ctx.rateAmount,
          credits: data.paidCredits,
          min: ctx.min,
          max: ctx.max,
        })
      ) {
        issues.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text_1758285686647a868tiok58q',
          path: ['paidCredits'],
        })
      }
    })

// Factory: recurring conditional requirements depend on trigger/method.
export const walletRecurringSchema = () =>
  z
    .object({
      enabled: z.boolean(),
      method: z.nativeEnum(RecurringTransactionMethodEnum),
      transactionName: z.string(),
      paidCredits: z.string(),
      grantedCredits: z.string(),
      invoiceRequiresSuccessfulPayment: z.boolean(),
      targetOngoingBalance: z.string(),
      trigger: z.nativeEnum(RecurringTransactionTriggerEnum),
      interval: z.nativeEnum(RecurringTransactionIntervalEnum),
      thresholdCredits: z.string(),
      startedAt: z.string().nullable(),
      expirationAt: z.string().nullable(),
    })
    .superRefine((data, ctx) => {
      if (!data.enabled) return

      if (data.trigger === RecurringTransactionTriggerEnum.Threshold && !data.thresholdCredits) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text_624ea7c29103fd010732ab7d',
          path: ['thresholdCredits'],
        })
      }

      if (data.method === RecurringTransactionMethodEnum.Target && !data.targetOngoingBalance) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text_624ea7c29103fd010732ab7d',
          path: ['targetOngoingBalance'],
        })
      }

      if (
        data.method === RecurringTransactionMethodEnum.Fixed &&
        !data.paidCredits &&
        !data.grantedCredits
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text_624ea7c29103fd010732ab7d',
          path: ['paidCredits'],
        })
      }
    })

// --- Slice ↔ item mappers ---
export const itemToSettings = (item: WalletFormItem): WalletSettingsSlice => ({
  name: item.name ?? '',
  rateAmount: item.rateAmount,
  priority: item.priority,
  expirationAt: item.expirationAt,
  paidTopUpMinAmountCents: item.paidTopUpMinAmountCents,
  paidTopUpMaxAmountCents: item.paidTopUpMaxAmountCents,
  purchaseOrderNumber: item.purchaseOrderNumber,
})

export const settingsToItem = (item: WalletFormItem, s: WalletSettingsSlice): WalletFormItem => ({
  ...item,
  name: s.name || null,
  rateAmount: s.rateAmount,
  priority: s.priority,
  expirationAt: s.expirationAt,
  paidTopUpMinAmountCents: s.paidTopUpMinAmountCents,
  paidTopUpMaxAmountCents: s.paidTopUpMaxAmountCents,
  purchaseOrderNumber: s.purchaseOrderNumber,
})

export const itemToScope = (item: WalletFormItem): WalletScopeSlice => ({
  feeTypes: item.feeTypes,
  billableMetricCodes: item.billableMetricCodes,
})

export const scopeToItem = (item: WalletFormItem, s: WalletScopeSlice): WalletFormItem => ({
  ...item,
  feeTypes: s.feeTypes,
  billableMetricCodes: s.billableMetricCodes,
})

export const itemToFreeAndPaid = (item: WalletFormItem): WalletFreeAndPaidSlice => ({
  freeCredits: item.freeCredits,
  paidCredits: item.paidCredits,
  invoiceRequiresSuccessfulPayment: item.invoiceRequiresSuccessfulPayment,
  metadata: item.metadata,
})

export const freeAndPaidToItem = (
  item: WalletFormItem,
  s: WalletFreeAndPaidSlice,
): WalletFormItem => ({
  ...item,
  freeCredits: s.freeCredits,
  paidCredits: s.paidCredits,
  invoiceRequiresSuccessfulPayment: s.invoiceRequiresSuccessfulPayment,
  metadata: s.metadata,
})

const DEFAULT_RECURRING_SLICE: WalletRecurringSlice = {
  enabled: false,
  method: RecurringTransactionMethodEnum.Fixed,
  transactionName: '',
  paidCredits: '',
  grantedCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  targetOngoingBalance: '',
  trigger: RecurringTransactionTriggerEnum.Threshold,
  interval: RecurringTransactionIntervalEnum.Monthly,
  thresholdCredits: '',
  startedAt: null,
  expirationAt: null,
}

export const itemToRecurring = (item: WalletFormItem): WalletRecurringSlice => {
  const r = item.recurringRule

  if (!r) return { ...DEFAULT_RECURRING_SLICE }

  return {
    enabled: true,
    method: r.method,
    transactionName: r.transactionName ?? '',
    paidCredits: r.paidCredits,
    grantedCredits: r.grantedCredits,
    invoiceRequiresSuccessfulPayment: r.invoiceRequiresSuccessfulPayment,
    targetOngoingBalance: r.targetOngoingBalance ?? '',
    trigger: r.trigger,
    interval: r.interval ?? RecurringTransactionIntervalEnum.Monthly,
    thresholdCredits: r.thresholdCredits ?? '',
    startedAt: r.startedAt,
    expirationAt: r.expirationAt,
  }
}

export const recurringToItem = (item: WalletFormItem, s: WalletRecurringSlice): WalletFormItem => {
  if (!s.enabled) return { ...item, recurringRule: null }

  const rule: WalletRecurringRuleForm = {
    trigger: s.trigger,
    method: s.method,
    interval: s.trigger === RecurringTransactionTriggerEnum.Interval ? s.interval : null,
    paidCredits: s.paidCredits,
    grantedCredits: s.grantedCredits,
    targetOngoingBalance:
      s.method === RecurringTransactionMethodEnum.Target ? s.targetOngoingBalance || null : null,
    thresholdCredits:
      s.trigger === RecurringTransactionTriggerEnum.Threshold ? s.thresholdCredits || null : null,
    startedAt: s.trigger === RecurringTransactionTriggerEnum.Interval ? s.startedAt : null,
    transactionName: s.transactionName || null,
    invoiceRequiresSuccessfulPayment: s.invoiceRequiresSuccessfulPayment,
    expirationAt: s.expirationAt,
  }

  return { ...item, recurringRule: rule }
}

export const isWalletItemPersistable = (item: WalletFormItem): boolean => {
  const hasRate = !!item.rateAmount && Number(item.rateAmount) > 0
  const hasCredits = Number(item.freeCredits || 0) > 0 || Number(item.paidCredits || 0) > 0

  return hasRate && hasCredits
}
