import { z } from 'zod'

import { zodDomain, zodOptionalHost, zodRequiredString } from '~/formValidation/zodCustoms'
import { CreateEntraIdIntegrationInput, CreateOktaIntegrationInput } from '~/generated/graphql'

export const oktaValidationSchema = z.object({
  domain: zodDomain,
  host: zodOptionalHost,
  clientId: zodRequiredString,
  clientSecret: z.string(),
  organizationName: zodRequiredString,
})

export const oktaDefaultValues: CreateOktaIntegrationInput = {
  domain: '',
  host: '',
  clientId: '',
  clientSecret: '',
  organizationName: '',
}

export const entraIdValidationSchema = z.object({
  domain: zodDomain,
  additionalDomains: z
    .array(z.string())
    .refine(
      (domains) => domains.every((domain) => zodDomain.safeParse(domain).success),
      'text_664c732c264d7eed1c74fe03',
    ),
  host: zodOptionalHost,
  clientId: zodRequiredString,
  clientSecret: z.string(),
  tenantId: zodRequiredString,
})

export const entraIdDefaultValues: CreateEntraIdIntegrationInput = {
  domain: '',
  additionalDomains: [],
  host: '',
  clientId: '',
  clientSecret: '',
  tenantId: '',
}

// The API update services keep the stored secret when none is sent, so only creation requires one.
export const buildCreateValidationSchema = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
): z.ZodType => schema.extend({ clientSecret: zodRequiredString })
