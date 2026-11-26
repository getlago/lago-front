import { z } from 'zod'

import { extractOptionValue } from '~/pages/settings/integrations/common/extractOptionValue'
import { refineIntegrationMapItemEntries } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

export const quickbooksMappingValidationSchema = z
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
        const { externalId, externalName } = extractOptionValue(selectedElementValue ?? '')

        if (externalId && externalName) return []

        return ['selectedElementValue']
      },
    }),
  )

export type QuickbooksMappingFormValues = z.infer<typeof quickbooksMappingValidationSchema>

export const quickbooksMappingDefaultValues: QuickbooksMappingFormValues = {
  default: {
    selectedElementValue: '',
  },
}
