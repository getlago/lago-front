import { z } from 'zod'

import {
  ConnectionBehavior,
  deriveConnectionBehavior,
  SelectedConnection,
} from '~/components/connectionSelection/types'
import {
  ConnectionCategory,
  IntegrationConnectionCategory,
} from '~/components/customerConnections/types'

export const ADDITIONAL_INTEGRATION_CATEGORIES: IntegrationConnectionCategory[] = [
  ConnectionCategory.Accounting,
  ConnectionCategory.Crm,
  ConnectionCategory.Tax,
]

export type AdditionalIntegrationSettingsValues = Record<
  IntegrationConnectionCategory,
  SelectedConnection
>

export const ADDITIONAL_INTEGRATION_SETTINGS_DEFAULT_VALUES: AdditionalIntegrationSettingsValues = {
  [ConnectionCategory.Accounting]: undefined,
  [ConnectionCategory.Crm]: undefined,
  [ConnectionCategory.Tax]: undefined,
}

const connectionChoiceSchema = z
  .custom<SelectedConnection>()
  .refine(
    (value) => !(deriveConnectionBehavior(value) === ConnectionBehavior.SPECIFIC && !value?.code),
    { message: 'text_624ea7c29103fd010732ab7d' },
  )

export const additionalIntegrationSettingsValidationSchema = z.object({
  [ConnectionCategory.Accounting]: connectionChoiceSchema,
  [ConnectionCategory.Crm]: connectionChoiceSchema,
  [ConnectionCategory.Tax]: connectionChoiceSchema,
})
