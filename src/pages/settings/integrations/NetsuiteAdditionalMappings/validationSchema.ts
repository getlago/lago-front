import { z } from 'zod'

import { CurrencyEnum, CurrencyMappingItemInput } from '~/generated/graphql'

export const netsuiteAdditionalMappingValidationSchema = z.object({
  default: z.array(
    z.object({
      currencyCode: z
        .enum(CurrencyEnum)
        .optional()
        .refine((value) => !!value, { message: 'text_1771342994699klxu2paz7g8' }),
      currencyExternalCode: z.string().min(1, { message: 'text_1771342994699klxu2paz7g8' }),
    }),
  ),
})

export type NetsuiteAdditionalMappingFormValues = z.infer<
  typeof netsuiteAdditionalMappingValidationSchema
>

export const netsuiteAdditionalMappingDefaultValues: NetsuiteAdditionalMappingFormValues = {
  default: [],
}

export const buildCurrenciesMappingInput = (
  values: NetsuiteAdditionalMappingFormValues,
): Array<CurrencyMappingItemInput> =>
  values.default.flatMap(({ currencyCode, currencyExternalCode }) =>
    currencyCode ? [{ currencyCode, currencyExternalCode }] : [],
  )
