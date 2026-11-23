import { z } from 'zod'

import { refineRequiredIntegrationMapItemFields } from '~/pages/settings/integrations/IntegrationMapItemDrawer/validationSchema'

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
  refineRequiredIntegrationMapItemFields(['taxCode', 'taxNexus', 'taxType']),
)

export const netsuiteNonTaxMappingValidationSchema = netsuiteMappingRecordSchema.superRefine(
  refineRequiredIntegrationMapItemFields(['externalId', 'externalName', 'externalAccountCode']),
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
