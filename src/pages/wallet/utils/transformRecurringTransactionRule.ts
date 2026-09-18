import {
  findConnectionRouting,
  toSelectedConnection,
} from '~/components/connectionSelection/fromConnectionRouting'
import { ConnectionCategoryEnum, GetWalletInfosForWalletFormQuery } from '~/generated/graphql'

type RecurringTransactionRuleFromQuery = NonNullable<
  NonNullable<GetWalletInfosForWalletFormQuery['wallet']>['recurringTransactionRules']
>[number]

export const transformRecurringTransactionRule = (rule: RecurringTransactionRuleFromQuery) => {
  // Extract and exclude fields that are not part of CreateRecurringTransactionRuleInput/UpdateRecurringTransactionRuleInput
  // These fields come from the GraphQL query but should not be included in the form values
  const fieldsToExclude = [
    'connections',
    'paymentMethodType',
    'skipInvoiceCustomSections',
    'selectedInvoiceCustomSections',
  ]

  const rules = Object.fromEntries(
    Object.entries(rule).filter(([key]) => !fieldsToExclude.includes(key)),
  ) as typeof rule

  return {
    ...rules,
    paymentConnection: toSelectedConnection(
      findConnectionRouting(rule.connections, ConnectionCategoryEnum.Payment),
    ),
    accountingConnection: toSelectedConnection(
      findConnectionRouting(rule.connections, ConnectionCategoryEnum.Accounting),
    ),
    crmConnection: toSelectedConnection(
      findConnectionRouting(rule.connections, ConnectionCategoryEnum.Crm),
    ),
    taxConnection: toSelectedConnection(
      findConnectionRouting(rule.connections, ConnectionCategoryEnum.Tax),
    ),
    paymentMethod: {
      paymentMethodType: rule.paymentMethodType,
      paymentMethodId: rule.paymentMethod?.id ?? null,
    },
    invoiceCustomSection: {
      invoiceCustomSections: rule.selectedInvoiceCustomSections || [],
      skipInvoiceCustomSections: rule.skipInvoiceCustomSections || false,
    },
  }
}
