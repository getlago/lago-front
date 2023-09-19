import { CodeSnippet } from '~/components/CodeSnippet'
import { CreditNoteForm } from '~/components/creditNote/types'
import { envGlobalVar } from '~/core/apolloClient'
import { serializeCreditNoteInput } from '~/core/serializers'
import { CreateCreditNoteInput, CurrencyEnum } from '~/generated/graphql'

const { apiUrl } = envGlobalVar()

interface CreditNoteCodeSnippetProps {
  loading: boolean
  invoiceId: string
  formValues: CreditNoteForm
  currency: CurrencyEnum
}

const getSnippet = (infos: CreateCreditNoteInput) => {
  return `# Assign a credit note to an invoice
curl --location --request POST "${apiUrl}/api/v1/credit_notes" \\
    --header "Authorization: Bearer $YOUR_API_KEY" \\
    --header 'Content-Type: application/json' \\
    --data-raw '{
      "credit_note": {
        "invoice_id": "${infos.invoiceId || '"__LAGO_INVOICE_ID__"'}",
        "reason": "${infos.reason || '__CREDIT_NOTE_REASON__'}",
        "credit_amount_cents": ${infos.creditAmountCents},
        "refund_amount_cents": ${infos.refundAmountCents},
        "items": [
          ${infos.items.reduce((acc, item, i) => {
            if (i === infos.items.length - 1) {
              return (
                acc +
                `{
            "fee_id": "${item.feeId}",
            "amount_cents": ${item.amountCents}
          }`
              )
            }
            if (i === 0) {
              return (
                acc +
                `{
            "fee_id": "${item.feeId}",
            "amount_cents": ${item.amountCents}
          },
          `
              )
            }

            return (
              acc +
              `{
            "fee_id": "${item.feeId}",
            "amount_cents": ${item.amountCents}
          },
          `
            )
          }, '')}
        ]
      }
    }'
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __LAGO_INVOICE_ID__ and  __CREDIT_NOTE_REASON__`
}

export const CreditNoteCodeSnippet = ({
  loading,
  invoiceId,
  formValues,
  currency,
}: CreditNoteCodeSnippetProps) => {
  const serializedInfos = serializeCreditNoteInput(invoiceId, formValues, currency)

  return <CodeSnippet loading={loading} language="bash" code={getSnippet(serializedInfos)} />
}
