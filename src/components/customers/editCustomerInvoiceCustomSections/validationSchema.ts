import { z } from 'zod'

export enum BehaviorType {
  FALLBACK = 'fallback',
  CUSTOM_SECTIONS = 'customSections',
  DEACTIVATE = 'deactivate',
}

export const editCustomerInvoiceCustomSectionsSchema = z
  .object({
    behavior: z.enum(BehaviorType),
    // The MultipleComboBox stores whole options, not plain ids: keep the option shape here and
    // map back to ids on submit.
    configurableInvoiceCustomSections: z.array(z.looseObject({ value: z.string() })),
  })
  .refine(
    (data) =>
      data.behavior !== BehaviorType.CUSTOM_SECTIONS ||
      data.configurableInvoiceCustomSections.length > 0,
    { path: ['configurableInvoiceCustomSections'], message: '' },
  )

export type EditCustomerInvoiceCustomSectionsFormValues = z.infer<
  typeof editCustomerInvoiceCustomSectionsSchema
>

export const editCustomerInvoiceCustomSectionsDefaultValues: EditCustomerInvoiceCustomSectionsFormValues =
  {
    behavior: BehaviorType.FALLBACK,
    configurableInvoiceCustomSections: [],
  }
