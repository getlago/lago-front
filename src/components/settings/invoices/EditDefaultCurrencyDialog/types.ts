import { z } from 'zod'

import {
  CurrencyEnum,
  EditBillingEntityDefaultCurrencyForDialogFragment,
} from '~/generated/graphql'

import { editDefaultCurrencyValidationSchema } from './validationSchema'

export type EditDefaultCurrencyFormValues = z.infer<typeof editDefaultCurrencyValidationSchema>

export type EditDefaultCurrencyDialogData = {
  billingEntity?: EditBillingEntityDefaultCurrencyForDialogFragment | null
}

export const EDIT_DEFAULT_CURRENCY_INITIAL_VALUES: EditDefaultCurrencyFormValues = {
  defaultCurrency: CurrencyEnum.Usd,
}
