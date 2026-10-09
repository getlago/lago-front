import { z } from 'zod'

import { refineIntegrationMapItemEntries } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

export const anrokMappingValidationSchema = z
  .record(
    z.string(),
    z.object({
      externalId: z.string(),
      externalName: z.string(),
    }),
  )
  .superRefine(
    refineIntegrationMapItemEntries((entry) =>
      (['externalId', 'externalName'] as const).filter((field) => !entry[field]),
    ),
  )

export type AnrokMappingFormValues = z.infer<typeof anrokMappingValidationSchema>

export const anrokMappingDefaultValues: AnrokMappingFormValues = {
  default: {
    externalId: '',
    externalName: '',
  },
}
