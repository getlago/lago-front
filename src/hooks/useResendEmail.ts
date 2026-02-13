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

  const resendEmailPerType = async ({ type, documentId }: ResendEmailParams) => {
    switch (type) {
      case BillingEntityEmailSettingsEnum.CreditNoteCreated:
        return await resendCreditNoteEmail({
          variables: {
            input: {
              id: documentId,
            },
          },
        })

      case BillingEntityEmailSettingsEnum.InvoiceFinalized:
        return await resentInvoiceEmail({
          variables: {
            input: {
              id: documentId,
            },
          },
        })

      case BillingEntityEmailSettingsEnum.PaymentReceiptCreated:
        return await resendPaymentReceiptEmail({
          variables: {
            input: {
              id: documentId,
            },
          },
        })

      default:
        throw new Error('Missing type')
    }
  }

  const resendEmail = async ({
    type,
    documentId,
  }: ResendEmailParams): Promise<
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
      const result = await resendEmailPerType({ type, documentId })

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
