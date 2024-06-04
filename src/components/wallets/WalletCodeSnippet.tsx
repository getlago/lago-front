import { CodeSnippet } from '~/components/CodeSnippet'
import { envGlobalVar } from '~/core/apolloClient'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { TWalletDataForm } from '~/pages/WalletForm'

const { apiUrl } = envGlobalVar()

const getSnippets = ({ wallet, isEdition }: { wallet?: TWalletDataForm; isEdition?: boolean }) => {
  if (!wallet || !wallet.rateAmount) return '# Fill the form to generate the code snippet'
  const { name, rateAmount, currency, recurringTransactionRules } = wallet

  return `# ${isEdition ? 'Edit' : 'Create'} a wallet on a customer
curl --location --request ${isEdition ? 'PUT' : 'POST'} "${apiUrl}/api/v1/wallets${
    isEdition ? '/:lago_id' : ''
  }" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "wallet": {${
      isEdition
        ? `
        "id": "b7ab2926-1de8-4428-9bcd-779314ac129b",`
        : ''
    }${
      name
        ? `
        "name": "${name}",`
        : ''
    }
        "rate_amount": "${rateAmount}",
        "currency": "${currency}",
        "external_customer_id": "__EXTERNAL_CUSTOMER_ID__",${
          wallet.expirationAt
            ? `,
        "expiration_at": "${wallet.expirationAt}",`
            : ''
        }${
          !isEdition
            ? `
        "paid_credits": "${
          wallet.paidCredits ? serializeAmount(wallet.paidCredits, wallet.currency) : '0'
        }",
        "granted_credits": "${
          wallet.grantedCredits ? serializeAmount(wallet.grantedCredits, wallet.currency) : '0'
        }"`
            : ''
        }${
          !!recurringTransactionRules?.[0]
            ? `,
        "recurring_transaction_rules": [
          {${
            isEdition && recurringTransactionRules[0].lagoId
              ? `
            "lago_id": "${recurringTransactionRules[0].lagoId}",`
              : ''
          }
            "method": "${wallet.recurringTransactionRules?.[0].method || '__MUST_BE_DEFINED__'}",${
              wallet.recurringTransactionRules?.[0].method === RecurringTransactionMethodEnum.Fixed
                ? `
            "paid_credits": "${
              wallet.recurringTransactionRules?.[0].paidCredits
                ? serializeAmount(
                    wallet.recurringTransactionRules?.[0].paidCredits,
                    wallet.currency,
                  )
                : '0'
            }",
            "granted_credits": "${
              wallet.recurringTransactionRules?.[0].grantedCredits
                ? serializeAmount(
                    wallet.recurringTransactionRules?.[0].grantedCredits,
                    wallet.currency,
                  )
                : '0'
            }",`
                : ''
            }${
              wallet.recurringTransactionRules?.[0].method === RecurringTransactionMethodEnum.Target
                ? `
            "target_ongoing_balance": "${
              wallet.recurringTransactionRules?.[0].targetOngoingBalance || '0'
            }",`
                : ''
            }
            "trigger": "${wallet.recurringTransactionRules?.[0].trigger || '__MUST_BE_DEFINED__'}"${
              wallet.recurringTransactionRules?.[0].trigger ===
              RecurringTransactionTriggerEnum.Interval
                ? `,
            "interval": "${
              wallet.recurringTransactionRules?.[0].interval || '__MUST_BE_DEFINED__'
            }",`
                : ''
            }${
              wallet.recurringTransactionRules?.[0].trigger ===
              RecurringTransactionTriggerEnum.Threshold
                ? `,
            "threshold_credits": "${wallet.recurringTransactionRules?.[0].thresholdCredits || '0'}"`
                : ''
            }${
              wallet.recurringTransactionRules?.[0].trigger ===
                RecurringTransactionTriggerEnum.Interval &&
              wallet.recurringTransactionRules?.[0].startedAt
                ? `
            "started_at": "${wallet.recurringTransactionRules?.[0].startedAt}"`
                : ''
            }
          }
        ]`
            : ''
        }
    }
  }'
  
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__ and  __EXTERNAL_CUSTOMER_ID__`
}

interface WalletCodeSnippetProps {
  loading?: boolean
  wallet?: TWalletDataForm
  isEdition?: boolean
}

export const WalletCodeSnippet = ({ wallet, loading, isEdition }: WalletCodeSnippetProps) => {
  return <CodeSnippet loading={loading} language="bash" code={getSnippets({ wallet, isEdition })} />
}
