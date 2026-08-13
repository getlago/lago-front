// src/core/serializers/buildWalletPreviewData.ts
import {
  CurrencyEnum,
  FeeTypesEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'

import type { WalletCreditPayload } from './serializeQuoteWallets'

// How the wallet line is billed — drives the "Billed" column.
export type WalletBilled =
  | { type: 'oneTime' } // initial paid credits
  | { type: 'none' } // free credits (no billing)
  | { type: 'interval'; interval: string } // recurring rule triggered on an interval
  | { type: 'threshold' } // recurring rule triggered when balance is low

// Credit count — drives the "Units" column.
export type WalletUnits = { type: 'count'; value: number } | { type: 'upTo'; value: number } // target-method top-up: "Up to N"

// Monetary value — drives the "Price" column.
export type WalletPrice =
  | { type: 'displayAmount'; amount: string }
  | { type: 'free' } // granted credits
  | { type: 'empty' } // variable (target-method recurring)

export type WalletPreviewRow = {
  kind: 'paid' | 'free' | 'recurring'
  // The first row carries the wallet name + expiration/scope caption in the Name
  // cell; subsequent rows show their own type label ("Free credits" / "Recurring top-up").
  isPrimary: boolean
  // Optional recurring-rule transaction name, appended to the "Recurring top-up" label.
  transactionName?: string
  billed: WalletBilled
  units: WalletUnits
  price: WalletPrice
}

export type WalletPreviewData = {
  name: string
  currency: CurrencyEnum
  expirationAt: string | null
  appliesTo: { feeTypes: FeeTypesEnum[]; billableMetricCodes: string[] }
  rows: WalletPreviewRow[]
}

const num = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v !== 'string') return 0

  const n = Number.parseFloat(v)

  return Number.isFinite(n) ? n : 0
}

// Credits are human-unit strings and rateAmount is currency-per-credit, so the
// displayed price is a plain multiplication — no cents (de)serialization here.
const money = (credits: number, rate: number): string => String(credits * rate)

export const buildWalletPreviewData = (payload: WalletCreditPayload): WalletPreviewData => {
  const rate = num(payload.rateAmount)
  const rows: WalletPreviewRow[] = []

  const paid = num(payload.paidCredits)
  const granted = num(payload.grantedCredits)

  // 1) Initial paid credits
  if (paid > 0) {
    rows.push({
      kind: 'paid',
      isPrimary: false,
      billed: { type: 'oneTime' },
      units: { type: 'count', value: paid },
      price: { type: 'displayAmount', amount: money(paid, rate) },
    })
  }

  // 2) Initial free (granted) credits
  if (granted > 0) {
    rows.push({
      kind: 'free',
      isPrimary: false,
      billed: { type: 'none' },
      units: { type: 'count', value: granted },
      price: { type: 'free' },
    })
  }

  // 3) One row per recurring top-up rule
  for (const rule of payload.recurringTransactionRules ?? []) {
    const isTarget = rule.method === RecurringTransactionMethodEnum.Target
    const isThreshold = rule.trigger === RecurringTransactionTriggerEnum.Threshold
    const rulePaid = num(rule.paidCredits)
    const ruleGranted = num(rule.grantedCredits)

    const billed: WalletBilled = isThreshold
      ? { type: 'threshold' }
      : { type: 'interval', interval: rule.interval ?? '' }
    const transactionName = rule.transactionName ?? undefined

    const pushRecurring = (units: WalletUnits, price: WalletPrice): void => {
      rows.push({ kind: 'recurring', isPrimary: false, transactionName, billed, units, price })
    }

    if (isTarget) {
      pushRecurring({ type: 'upTo', value: num(rule.targetOngoingBalance) }, { type: 'empty' })
      continue
    }

    // Fixed method can fund paid and/or granted (free) credits — the form allows
    // both — so emit one row per non-zero credit type instead of dropping either.
    if (rulePaid > 0) {
      pushRecurring(
        { type: 'count', value: rulePaid },
        { type: 'displayAmount', amount: money(rulePaid, rate) },
      )
    }
    if (ruleGranted > 0) {
      pushRecurring({ type: 'count', value: ruleGranted }, { type: 'free' })
    }
  }

  if (rows.length > 0) {
    rows[0].isPrimary = true
  }

  return {
    name: payload.name ?? '',
    currency: (payload.currency as CurrencyEnum) ?? CurrencyEnum.Usd,
    expirationAt: payload.expirationAt ?? null,
    appliesTo: {
      feeTypes: (payload.appliesTo?.feeTypes ?? []) as FeeTypesEnum[],
      billableMetricCodes: payload.appliesTo?.billableMetricCodes ?? [],
    },
    rows,
  }
}
