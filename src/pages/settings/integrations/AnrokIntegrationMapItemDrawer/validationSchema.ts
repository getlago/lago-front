import { z } from 'zod'

import { refineRequiredIntegrationMapItemFields } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

export const anrokMappingValidationSchema = z
  .record(
    z.string(),
    z.object({
      externalId: z.string(),
      externalName: z.string(),
    }),
  )
  .superRefine(refineRequiredIntegrationMapItemFields(['externalId', 'externalName']))

export type AnrokMappingFormValues = z.infer<typeof anrokMappingValidationSchema>

export const anrokMappingDefaultValues: AnrokMappingFormValues = {
  default: {
    externalId: '',
    externalName: '',
  },
}
