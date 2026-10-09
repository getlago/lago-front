import { z } from 'zod'

import { refineIntegrationMapItemEntries } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

const netsuiteMappingRecordSchema = z.record(
  z.string(),
  z.object({
    taxCode: z.string(),
    taxNexus: z.string(),
    taxType: z.string(),
    externalId: z.string(),
    externalName: z.string(),
    externalAccountCode: z.string(),
  }),
)

export const netsuiteTaxMappingValidationSchema = netsuiteMappingRecordSchema.superRefine(
  refineIntegrationMapItemEntries((entry) =>
    (['taxCode', 'taxNexus', 'taxType'] as const).filter((field) => !entry[field]),
  ),
)

export const netsuiteNonTaxMappingValidationSchema = netsuiteMappingRecordSchema.superRefine(
  refineIntegrationMapItemEntries((entry) =>
    (['externalId', 'externalName', 'externalAccountCode'] as const).filter(
      (field) => !entry[field],
    ),
  ),
)

export type NetsuiteMappingFormValues = z.infer<typeof netsuiteMappingRecordSchema>

export const netsuiteMappingDefaultValues: NetsuiteMappingFormValues = {
  default: {
    taxCode: '',
    taxNexus: '',
    taxType: '',
    externalId: '',
    externalName: '',
    externalAccountCode: '',
  },
}
