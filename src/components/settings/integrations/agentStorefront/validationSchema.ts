import { z } from 'zod'

import { CreateAgentStorefrontIntegrationInput } from '~/generated/graphql'

const REQUIRED_ERROR = 'text_624ea7c29103fd010732ab7d'

export const AGENT_STOREFRONT_REFUSAL_REASONS = ['eventsTargetingWallets', 'walletRefresh'] as const

export type AgentStorefrontRefusalReason = (typeof AGENT_STOREFRONT_REFUSAL_REASONS)[number]

export const addAgentStorefrontValidationSchema = z.object({
  name: z.string().min(1, { message: REQUIRED_ERROR }),
  code: z.string().min(1, { message: REQUIRED_ERROR }),
  resourceEndpoint: z.string(),
  resourceInstructions: z.string(),
  paymentProviderCode: z.string({ error: REQUIRED_ERROR }).min(1, { message: REQUIRED_ERROR }),
  refusalReason: z.enum(AGENT_STOREFRONT_REFUSAL_REASONS).nullable(),
})

type AddAgentStorefrontFormValues = z.infer<typeof addAgentStorefrontValidationSchema>

export const addAgentStorefrontDefaultValues: AddAgentStorefrontFormValues = {
  name: '',
  code: '',
  resourceEndpoint: '',
  resourceInstructions: '',
  paymentProviderCode: '',
  refusalReason: null,
}

export const mapFromFormToApi = (
  values: AddAgentStorefrontFormValues,
): CreateAgentStorefrontIntegrationInput => ({
  name: values.name,
  code: values.code,
  resourceEndpoint: values.resourceEndpoint,
  resourceInstructions: values.resourceInstructions,
  paymentProviderCode: values.paymentProviderCode,
})
