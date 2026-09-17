import { z } from 'zod'

import { editBillingEntityGracePeriodValidationSchema } from './validationSchema'

export type EditBillingEntityGracePeriodFormValues = z.infer<
  typeof editBillingEntityGracePeriodValidationSchema
>

export type EditBillingEntityGracePeriodDialogData = {
  id: string
  invoiceGracePeriod: number
}

export const EDIT_BILLING_ENTITY_GRACE_PERIOD_INITIAL_VALUES: EditBillingEntityGracePeriodFormValues =
  {
    invoiceGracePeriod: '',
  }
