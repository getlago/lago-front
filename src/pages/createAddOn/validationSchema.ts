import { z } from 'zod'

import { CurrencyEnum, TaxForTaxesSelectorSectionFragment } from '~/generated/graphql'

// Display-only taxes, replaced by taxCodes[] on save (see AddOnFormInput)
const taxSchema = z.custom<TaxForTaxesSelectorSectionFragment>()

export const addOnFormSchema = z
  .object({
    name: z.string().min(1, ''),
    code: z.string().min(1, ''),
    description: z.string().optional(),
    amountCents: z.union([z.string(), z.number()]).optional(),
    amountCurrency: z.enum(CurrencyEnum),
    taxes: z.array(taxSchema).optional(),
  })
  // Was: yup.number().min(0.01).required() — amountCents is a display string in form state
  .refine(
    (data) => {
      if (data.amountCents === undefined || data.amountCents === '') {
        return false
      }

      const amount = Number(data.amountCents)

      if (isNaN(amount)) {
        return false
      }

      return amount >= 0.01
    },
    {
      message: 'text_62978ebe99054a011fc189e0',
      path: ['amountCents'],
    },
  )

export type AddOnFormValues = z.infer<typeof addOnFormSchema>

export const emptyAddOnDefaultValues: AddOnFormValues = {
  name: '',
  code: '',
  description: '',
  amountCents: undefined,
  amountCurrency: CurrencyEnum.Usd,
  taxes: [],
}
