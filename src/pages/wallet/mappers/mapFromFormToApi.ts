import { DateTime } from 'luxon'

import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreateCustomerWalletInput,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  UpdateCustomerWalletInput,
} from '~/generated/graphql'
import { WALLET_DEFAULT_PRIORITY } from '~/pages/wallet/mappers/mapFromApiToForm'
import { TWalletDataForm } from '~/pages/wallet/types'

/**
 * Form → mutation input mappers — extraction of the inline serialization
 * previously living in CreateWallet.tsx's onSubmit. Behaviour is a 1:1 port:
 *
 * - `recurringTransactionRules` formatting: interval/thresholdCredits are
 *   nulled based on the trigger, `startedAt` defaults to now-ISO when
 *   trigger=Interval, credits `''` → `'0'`, `lagoId` is only carried on
 *   edition, `grantsTargetTopUp` only when method=Target.
 * - `appliesTo` is ALWAYS sent as `{ feeTypes: [], billableMetricIds: [] }`.
 * - `billingEntityId`: `null` (not `undefined`) on clear → BE stores NULL on
 *   the wallet column, meaning "inherit from customer".
 * - `paidTopUpMin/MaxAmountCents` asymmetry: create OMITS the keys when
 *   falsy, update sends an explicit `null` (clears the stored value).
 * - `rateAmount` is `String()`-converted only — NO serializeAmount.
 * - create-only fields (`currency`, `rateAmount`, `grantedCredits`,
 *   `paidCredits`, `transactionName`, `ignorePaidTopUpLimitsOnCreation`)
 *   never reach the update input.
 */

const formatRecurringTransactionRules = (
  recurringTransactionRules: TWalletDataForm['recurringTransactionRules'],
  formType: keyof typeof FORM_TYPE_ENUM,
) => {
  if (!recurringTransactionRules || recurringTransactionRules.length === 0) return []

  return recurringTransactionRules.map((rule) => {
    const {
      interval,
      trigger,
      thresholdCredits,
      method,
      targetOngoingBalance,
      startedAt,
      invoiceRequiresSuccessfulPayment,
      paidCredits: rulePaidCredit,
      grantedCredits: ruleGrantedCredit,
      grantsTargetTopUp,
      expirationAt,
      ignorePaidTopUpLimits,
      invoiceCustomSection: ruleInvoiceCustomSection,
      ...rest
    } = rule

    let targetedBalance: string | null = null

    if (method === RecurringTransactionMethodEnum.Target && targetOngoingBalance === '') {
      targetedBalance = '0'
    } else if (method === RecurringTransactionMethodEnum.Target) {
      targetedBalance = String(targetOngoingBalance)
    }

    return {
      ...rest,
      lagoId:
        'lagoId' in rule && formType === FORM_TYPE_ENUM.edition
          ? (rule.lagoId as string | undefined)
          : undefined,
      method: method as RecurringTransactionMethodEnum,
      trigger: trigger as RecurringTransactionTriggerEnum,
      interval: trigger === RecurringTransactionTriggerEnum.Interval ? interval : null,
      startedAt:
        trigger === RecurringTransactionTriggerEnum.Interval
          ? (startedAt ?? DateTime.now().toISO())
          : null,
      thresholdCredits:
        trigger === RecurringTransactionTriggerEnum.Threshold ? thresholdCredits : null,
      paidCredits: rulePaidCredit === '' ? '0' : String(rulePaidCredit),
      grantedCredits: ruleGrantedCredit === '' ? '0' : String(ruleGrantedCredit),
      targetOngoingBalance: targetedBalance,
      grantsTargetTopUp:
        method === RecurringTransactionMethodEnum.Target ? Boolean(grantsTargetTopUp) : null,
      invoiceRequiresSuccessfulPayment,
      ignorePaidTopUpLimits,
      expirationAt: expirationAt === '' ? null : expirationAt,
      invoiceCustomSection: toInvoiceCustomSectionReference(
        ruleInvoiceCustomSection as InvoiceCustomSectionInput,
      ),
    }
  })
}

const formatAppliesTo = (appliesTo: TWalletDataForm['appliesTo']) => ({
  feeTypes: appliesTo?.feeTypes || [],
  billableMetricIds: appliesTo?.billableMetrics?.map((bm) => bm.id) || [],
})

export const mapFormToCreateInput = (
  formValues: TWalletDataForm,
  customerId: string,
): CreateCustomerWalletInput => {
  const {
    grantedCredits,
    paidCredits,
    rateAmount,
    currency,
    recurringTransactionRules,
    appliesTo,
    priority,
    paymentMethod,
    invoiceCustomSection,
    billingEntityId,
    ...values
  } = formValues

  return {
    ...values,
    customerId,
    // `null` (not `undefined`) on clear → BE stores NULL on the
    // wallet column, meaning "inherit from customer".
    billingEntityId: billingEntityId || null,
    currency,
    rateAmount: String(rateAmount),
    grantedCredits: grantedCredits === '' ? '0' : String(grantedCredits),
    paidCredits: paidCredits === '' ? '0' : String(paidCredits),
    recurringTransactionRules: formatRecurringTransactionRules(
      recurringTransactionRules,
      FORM_TYPE_ENUM.creation,
    ),
    appliesTo: formatAppliesTo(appliesTo),
    paymentMethod,
    invoiceCustomSection: toInvoiceCustomSectionReference(invoiceCustomSection),
    ...(values.paidTopUpMinAmountCents
      ? { paidTopUpMinAmountCents: serializeAmount(values.paidTopUpMinAmountCents, currency) }
      : {}),
    ...(values.paidTopUpMaxAmountCents
      ? { paidTopUpMaxAmountCents: serializeAmount(values.paidTopUpMaxAmountCents, currency) }
      : {}),
    priority: priority || WALLET_DEFAULT_PRIORITY,
  }
}

export const mapFormToUpdateInput = (
  formValues: TWalletDataForm,
  walletId: string,
): UpdateCustomerWalletInput => {
  /* eslint-disable @typescript-eslint/no-unused-vars -- object-rest omit: create-only fields must not reach the update input */
  const {
    grantedCredits,
    paidCredits,
    rateAmount,
    currency,
    recurringTransactionRules,
    appliesTo,
    priority,
    paymentMethod,
    invoiceCustomSection,
    billingEntityId,
    transactionName,
    ignorePaidTopUpLimitsOnCreation,
    ...values
  } = formValues
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return {
    ...values,
    recurringTransactionRules: formatRecurringTransactionRules(
      recurringTransactionRules,
      FORM_TYPE_ENUM.edition,
    ),
    id: walletId,
    // `null` (not `undefined`) on clear → BE stores NULL on the
    // wallet column, meaning "inherit from customer".
    billingEntityId: billingEntityId || null,
    appliesTo: formatAppliesTo(appliesTo),
    paymentMethod,
    invoiceCustomSection: toInvoiceCustomSectionReference(invoiceCustomSection),
    // Unlike creation, clearing min/max on update must send an explicit
    // `null` so the BE erases the stored value (omitting would keep it).
    ...(values.paidTopUpMinAmountCents
      ? { paidTopUpMinAmountCents: serializeAmount(values.paidTopUpMinAmountCents, currency) }
      : { paidTopUpMinAmountCents: null }),
    ...(values.paidTopUpMaxAmountCents
      ? { paidTopUpMaxAmountCents: serializeAmount(values.paidTopUpMaxAmountCents, currency) }
      : { paidTopUpMaxAmountCents: null }),
    priority: priority || WALLET_DEFAULT_PRIORITY,
  }
}
