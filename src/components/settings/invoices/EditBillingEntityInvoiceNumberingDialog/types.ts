import { z } from 'zod'

import { BillingEntityDocumentNumberingEnum } from '~/generated/graphql'

import { editBillingEntityInvoiceNumberingValidationSchema } from './validationSchema'

export type EditBillingEntityInvoiceNumberingFormValues = z.infer<
  typeof editBillingEntityInvoiceNumberingValidationSchema
>

export type EditBillingEntityInvoiceNumberingDialogData = {
  id: string
  documentNumbering?: BillingEntityDocumentNumberingEnum | null
  documentNumberPrefix?: string | null
}

export const EDIT_BILLING_ENTITY_INVOICE_NUMBERING_INITIAL_VALUES: EditBillingEntityInvoiceNumberingFormValues =
  {
    documentNumbering: BillingEntityDocumentNumberingEnum.PerCustomer,
    documentNumberPrefix: '',
  }

export const DynamicPrefixTranslationLookup: Record<BillingEntityDocumentNumberingEnum, string> = {
  [BillingEntityDocumentNumberingEnum.PerCustomer]: 'text_6566f920a1d6c35693d6cce0',
  [BillingEntityDocumentNumberingEnum.PerBillingEntity]: 'YYYYMM',
}
