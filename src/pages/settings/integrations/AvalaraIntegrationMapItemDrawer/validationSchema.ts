import { z } from 'zod'

import { refineIntegrationMapItemEntries } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

export const avalaraMappingValidationSchema = z
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

export type AvalaraMappingFormValues = z.infer<typeof avalaraMappingValidationSchema>

export const avalaraMappingDefaultValues: AvalaraMappingFormValues = {
  default: {
    externalId: '',
    externalName: '',
  },
}
