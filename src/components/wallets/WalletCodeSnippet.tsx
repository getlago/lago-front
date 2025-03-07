import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { snippetBuilder, SnippetVariables } from '~/core/utils/snippetBuilder'
import {
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { TWalletDataForm } from '~/pages/wallet'

const { apiUrl } = envGlobalVar()

interface WalletCodeSnippetProps {
  loading?: boolean
  wallet?: TWalletDataForm
  isEdition?: boolean
  lagoId?: string
}

export const WalletCodeSnippet = ({
  wallet,
  loading,
  isEdition,
  lagoId,
}: WalletCodeSnippetProps) => {
  if (!wallet || !wallet.rateAmount) return '# Fill the form to generate the code snippet'

  const {
    name,
    rateAmount,
    currency,
    expirationAt,
    paidCredits,
    grantedCredits,
    recurringTransactionRules,
    invoiceRequiresSuccessfulPayment,
  } = wallet

  const rtRule = recurringTransactionRules?.[0]

  return (
    <CodeSnippet
      loading={loading}
      language="bash"
      code={snippetBuilder({
        title: `${isEdition ? 'Edit' : 'Create'} a wallet on a customer`,
        url: `${apiUrl}/api/v1/wallets${isEdition ? `/${lagoId ?? ':lago_id'}` : ''}`,
        method: isEdition ? 'PUT' : 'POST',
        headers: [
          {
            Authorization: `Bearer $${SnippetVariables.API_KEY}`,
          },
          {
            'Content-Type': 'application/json',
          },
        ],
        data: {
          wallet: {
            ...(isEdition
              ? { id: lagoId ? lagoId : SnippetVariables.MUST_BE_DEFINED }
              : { external_customer_id: SnippetVariables.EXTERNAL_CUSTOMER_ID }),
            ...(name && { name }),
            rate_amount: rateAmount,
            currency: currency,
            ...(expirationAt && { expiration_at: expirationAt }),
            ...(!isEdition && {
              paid_credits: paidCredits || '0',
              granted_credits: grantedCredits || '0',
            }),
            ...(isEdition
              ? {
                  invoice_requires_successful_payment: invoiceRequiresSuccessfulPayment ?? false,
                }
              : paidCredits && {
                  invoice_requires_successful_payment: invoiceRequiresSuccessfulPayment ?? false,
                }),
            ...(!!rtRule && {
              recurring_transaction_rules: [
                {
                  ...(isEdition && { lago_id: rtRule.lagoId }),
                  method: rtRule.method || SnippetVariables.MUST_BE_DEFINED,
                  ...(rtRule.method === RecurringTransactionMethodEnum.Fixed && {
                    paid_credits: rtRule.paidCredits || '0',
                    ...(!!rtRule.paidCredits && {
                      invoiceRequiresSuccessfulPayment: `${rtRule.invoiceRequiresSuccessfulPayment ?? false}`,
                    }),
                    granted_credits: rtRule.grantedCredits || '0',
                  }),
                  ...(rtRule.method === RecurringTransactionMethodEnum.Target && {
                    target_ongoing_balance: rtRule.targetOngoingBalance || '0',
                    ...(!!rtRule.targetOngoingBalance && {
                      invoiceRequiresSuccessfulPayment: `${rtRule.invoiceRequiresSuccessfulPayment ?? false}`,
                    }),
                  }),
                  trigger: rtRule.trigger || SnippetVariables.MUST_BE_DEFINED,
                  ...(rtRule.trigger === RecurringTransactionTriggerEnum.Interval && {
                    interval: rtRule.interval || SnippetVariables.MUST_BE_DEFINED,
                  }),
                  ...(rtRule.trigger === RecurringTransactionTriggerEnum.Threshold && {
                    threshold_credits: rtRule.thresholdCredits || '0',
                  }),
                  ...(rtRule.trigger === RecurringTransactionTriggerEnum.Interval &&
                    rtRule.startedAt && { started_at: rtRule.startedAt }),
                },
              ],
            }),
          },
        },
        footerComment: `To use the snippet, don’t forget to edit your ${SnippetVariables.API_KEY}${!isEdition ? ` and ${SnippetVariables.EXTERNAL_CUSTOMER_ID}` : ''}`,
      })}
    />
  )
}
