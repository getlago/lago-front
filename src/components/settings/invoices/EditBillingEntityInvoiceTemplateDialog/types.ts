import { z } from 'zod'

import { editBillingEntityInvoiceTemplateValidationSchema } from './validationSchema'

export type EditBillingEntityInvoiceTemplateFormValues = z.infer<
  typeof editBillingEntityInvoiceTemplateValidationSchema
>

export type EditBillingEntityInvoiceTemplateDialogData = {
  id: string
  invoiceFooter: string
}

export const EDIT_BILLING_ENTITY_INVOICE_TEMPLATE_INITIAL_VALUES: EditBillingEntityInvoiceTemplateFormValues =
  {
    invoiceFooter: '',
  }
