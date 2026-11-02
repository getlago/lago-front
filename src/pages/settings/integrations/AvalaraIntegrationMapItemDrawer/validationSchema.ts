import { z } from 'zod'

import { refineRequiredIntegrationMapItemFields } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

export const avalaraMappingValidationSchema = z
  .record(
    z.string(),
    z.object({
      externalId: z.string(),
      externalName: z.string(),
    }),
  )
  .superRefine(refineRequiredIntegrationMapItemFields(['externalId', 'externalName']))

export type AvalaraMappingFormValues = z.infer<typeof avalaraMappingValidationSchema>

export const avalaraMappingDefaultValues: AvalaraMappingFormValues = {
  default: {
    externalId: '',
    externalName: '',
  },
}
