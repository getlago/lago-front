import { z } from 'zod'

import { zodMetadataSchema } from '~/formValidation/metadataSchema'

export const MAX_CREDIT_NOTE_METADATA_COUNT = 50
export const CREDIT_NOTE_METADATA_KEY_MAX_LENGTH = 40
export const CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH = 255

export const metadataEditValidationSchema = z.object({
  metadata: zodMetadataSchema(
    CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH,
    CREDIT_NOTE_METADATA_KEY_MAX_LENGTH,
  ),
})

type MetadataEditFormValues = {
  metadata: Array<{ key: string; value: string }>
}

export const METADATA_EDIT_DEFAULT_VALUES: MetadataEditFormValues = {
  metadata: [],
}
