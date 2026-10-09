import { z } from 'zod'

import { refineIntegrationMapItemEntries } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

import { extractOptionValue } from './extractOptionValue'

export const xeroMappingValidationSchema = z
  .record(
    z.string(),
    z.object({
      selectedElementValue: z.string().optional(),
    }),
  )
  .superRefine(
    refineIntegrationMapItemEntries(({ selectedElementValue }) => {
      const { externalAccountCode, externalId, externalName } = extractOptionValue(
        selectedElementValue ?? '',
      )

      if (externalAccountCode && externalId && externalName) return []

      return ['selectedElementValue']
    }),
  )

export type XeroMappingFormValues = z.infer<typeof xeroMappingValidationSchema>

export const xeroMappingDefaultValues: XeroMappingFormValues = {
  default: {
    selectedElementValue: '',
  },
}
