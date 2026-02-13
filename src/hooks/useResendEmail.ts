import { gql } from '@apollo/client'

import {
  BillingEntityEmailSettingsEnum,
  ResendCreditNoteEmailMutation,
  ResendInvoiceEmailMutation,
  ResendPaymentReceiptEmailMutation,
  useResendCreditNoteEmailMutation,
  useResendInvoiceEmailMutation,
  useResendPaymentReceiptEmailMutation,
} from '~/generated/graphql'

gql`
  mutation resendCreditNoteEmail($input: ResendCreditNoteEmailInput!) {
    resendCreditNoteEmail(input: $input) {
      id
    }
  }

  mutation resendInvoiceEmail($input: ResendInvoiceEmailInput!) {
    resendInvoiceEmail(input: $input) {
      id
    }
  }

  mutation resendPaymentReceiptEmail($input: ResendPaymentReceiptEmailInput!) {
    resendPaymentReceiptEmail(input: $input) {
      id
    }
  }
`

export type ResendEmailParams = {
  type: BillingEntityEmailSettingsEnum
  documentId: string
  to?: Array<string>
  cc?: Array<string>
  bcc?: Array<string>
}

export type ResendEmailFetchResult =
  | ResendCreditNoteEmailMutation
  | ResendInvoiceEmailMutation
  | ResendPaymentReceiptEmailMutation
  | null
  | undefined

export const useResendEmail = () => {
  const [resendCreditNoteEmail] = useResendCreditNoteEmailMutation()
  const [resentInvoiceEmail] = useResendInvoiceEmailMutation()
  const [resendPaymentReceiptEmail] = useResendPaymentReceiptEmailMutation()

  const resendEmailPerType = async ({ type, documentId, to, cc, bcc }: ResendEmailParams) => {
    const recipients = {
      ...(to && to.length ? { to } : {}),
      ...(cc && cc.length ? { cc } : {}),
      ...(bcc && bcc.length ? { bcc } : {}),
    }

    switch (type) {
      case BillingEntityEmailSettingsEnum.CreditNoteCreated:
        return await resendCreditNoteEmail({
          variables: {
            input: {
              id: documentId,
              ...recipients,
            },
          },
        })

      case BillingEntityEmailSettingsEnum.InvoiceFinalized:
        return await resentInvoiceEmail({
          variables: {
            input: {
              id: documentId,
              ...recipients,
            },
          },
        })

      case BillingEntityEmailSettingsEnum.PaymentReceiptCreated:
        return await resendPaymentReceiptEmail({
          variables: {
            input: {
              id: documentId,
              ...recipients,
            },
          },
        })

      default:
        throw new Error('Missing type')
    }
  }

  const resendEmail = async (
    params: ResendEmailParams,
  ): Promise<
    | {
        success: true
        response: ResendEmailFetchResult
      }
    | {
        success: false
        error: Error
      }
  > => {
    try {
      const result = await resendEmailPerType(params)

      return {
        success: true,
        response: result.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      }
    }
  }

  return {
    resendEmail,
  }
}
