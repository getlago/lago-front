import { z } from 'zod'

import { extractOptionValue } from '~/pages/settings/integrations/common/extractOptionValue'
import { refineIntegrationMapItemEntries } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

export const xeroMappingValidationSchema = z
  .record(
    z.string(),
    z.object({
      selectedElementValue: z.string().optional(),
    }),
  )
  .superRefine(
    refineIntegrationMapItemEntries({
      isFilled: ({ selectedElementValue }) => !!selectedElementValue,
      getMissingFields: ({ selectedElementValue }) => {
        const { externalAccountCode, externalId, externalName } = extractOptionValue(
          selectedElementValue ?? '',
        )

        if (externalAccountCode && externalId && externalName) return []

        return ['selectedElementValue']
      },
    }),
  )

export type XeroMappingFormValues = z.infer<typeof xeroMappingValidationSchema>

export const xeroMappingDefaultValues: XeroMappingFormValues = {
  default: {
    selectedElementValue: '',
  },
}
