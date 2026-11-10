import { z } from 'zod'

import { editBillingEntityDocumentLocaleValidationSchema } from './validationSchema'

export type EditBillingEntityDocumentLocaleFormValues = z.infer<
  typeof editBillingEntityDocumentLocaleValidationSchema
>

export type OpenEditBillingEntityDocumentLocaleDialogProps = {
  id: string
  documentLocale: string
}

export const EDIT_BILLING_ENTITY_DOCUMENT_LOCALE_INITIAL_VALUES: EditBillingEntityDocumentLocaleFormValues =
  {
    documentLocale: '',
  }
