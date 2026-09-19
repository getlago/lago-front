import {
  EditBillingEntityGracePeriodDialogData,
  EditBillingEntityGracePeriodFormValues,
} from './types'

export const getInitialGracePeriod = (
  data: EditBillingEntityGracePeriodDialogData,
): EditBillingEntityGracePeriodFormValues['invoiceGracePeriod'] => data.invoiceGracePeriod ?? ''
