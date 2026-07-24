import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  GetWalletInfosForWalletFormQuery,
} from '~/generated/graphql'
import { TWalletDataForm } from '~/pages/wallet/types'
import { transformRecurringTransactionRule } from '~/pages/wallet/utils/transformRecurringTransactionRule'

export const WALLET_DEFAULT_PRIORITY = 50

/**
 * Builds the wallet form default values — extraction of the inline
 * `useFormik.initialValues` previously living in CreateWallet.tsx.
 *
 * Handles BOTH modes: pass `wallet: undefined` for creation (empty defaults)
 * or the fetched wallet for edition (prefilled values).
 *
 * `currency` must be resolved by the caller FIRST
 * (wallet.currency || customer.currency || organization.defaultCurrency || USD)
 * because it cannot be derived from the wallet alone and it drives both the
 * `rateAmount` display format and the min/max amount deserialization.
 */
export const mapFromApiToForm = ({
  wallet,
  customerData,
  currency,
}: {
  wallet: GetWalletInfosForWalletFormQuery['wallet'] | undefined
  customerData: GetCustomerInfosForWalletFormQuery | undefined
  currency: CurrencyEnum
}): TWalletDataForm => ({
  currency,
  billingEntityId:
    wallet?.billingEntityId || customerData?.customer?.billingEntity?.id || undefined,
  expirationAt: wallet?.expirationAt || undefined,
  grantedCredits: '',
  name: wallet?.name || '',
  code: wallet?.code || '',
  transactionName: undefined,
  appliesTo: wallet?.appliesTo || {
    feeTypes: [],
    billableMetrics: [],
  },
  paidCredits: '',
  rateAmount: intlFormatNumber(wallet?.rateAmount ?? 1, {
    currency,
    style: 'decimal',
    minimumFractionDigits: getCurrencyPrecision(currency),
  }),
  recurringTransactionRules:
    wallet?.recurringTransactionRules?.map(transformRecurringTransactionRule) || undefined,
  invoiceRequiresSuccessfulPayment: wallet?.invoiceRequiresSuccessfulPayment ?? false,
  paidTopUpMinAmountCents: wallet?.paidTopUpMinAmountCents
    ? deserializeAmount(wallet.paidTopUpMinAmountCents, currency)
    : undefined,
  paidTopUpMaxAmountCents: wallet?.paidTopUpMaxAmountCents
    ? deserializeAmount(wallet.paidTopUpMaxAmountCents, currency)
    : undefined,
  ignorePaidTopUpLimitsOnCreation: false,
  priority: wallet?.priority || WALLET_DEFAULT_PRIORITY,
  paymentMethod: {
    paymentMethodType: wallet?.paymentMethodType,
    paymentMethodId: wallet?.paymentMethod?.id,
  },
  invoiceCustomSection: {
    invoiceCustomSections: wallet?.selectedInvoiceCustomSections || [],
    skipInvoiceCustomSections: wallet?.skipInvoiceCustomSections || false,
  },
})

/**
 * Static empty defaults — used for `withForm` section typing only.
 * The real runtime defaults are built via `mapFromApiToForm`.
 */
export const emptyWalletFormDefaultValues = (): TWalletDataForm =>
  mapFromApiToForm({ wallet: undefined, customerData: undefined, currency: CurrencyEnum.Usd })
