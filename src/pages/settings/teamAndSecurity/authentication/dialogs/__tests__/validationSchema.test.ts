import { z } from 'zod'

import {
  buildCreateValidationSchema,
  entraIdValidationSchema,
  oktaValidationSchema,
} from '~/pages/settings/teamAndSecurity/authentication/dialogs/validationSchema'

const REQUIRED_FIELD_MESSAGE = 'text_1771342994699klxu2paz7g8'

const oktaValues = {
  domain: 'example.com',
  host: '',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  organizationName: 'org-name',
}

const entraIdValues = {
  domain: 'example.com',
  additionalDomains: [],
  host: '',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  tenantId: 'tenant-id',
}

const getErrorPaths = (result: {
  success: boolean
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}): string[] =>
  result.error?.issues
    .filter((issue) => issue.message === REQUIRED_FIELD_MESSAGE)
    .map((issue) => issue.path.join('.')) ?? []

const describeSSOValidationSchema = <TShape extends z.ZodRawShape>(
  provider: string,
  schema: z.ZodObject<TShape>,
  validValues: Record<string, unknown>,
  alwaysRequiredFields: string[],
): void =>
  describe(`${provider} validation schema`, () => {
    const createSchema = buildCreateValidationSchema(schema)

    describe('GIVEN the edit schema', () => {
      it('THEN accepts an empty client secret', () => {
        expect(schema.safeParse({ ...validValues, clientSecret: '' }).success).toBe(true)
      })

      it.each(alwaysRequiredFields)('THEN requires %s', (field) => {
        const result = schema.safeParse({ ...validValues, [field]: '' })

        expect(getErrorPaths(result)).toEqual([field])
      })
    })

    describe('GIVEN the create schema', () => {
      it('THEN accepts complete values', () => {
        expect(createSchema.safeParse(validValues).success).toBe(true)
      })

      it.each(['', '   '])('THEN requires the client secret (%j)', (clientSecret) => {
        const result = createSchema.safeParse({ ...validValues, clientSecret })

        expect(getErrorPaths(result)).toEqual(['clientSecret'])
      })

      it.each(alwaysRequiredFields)('THEN still requires %s', (field) => {
        const result = createSchema.safeParse({ ...validValues, [field]: '' })

        expect(getErrorPaths(result)).toEqual([field])
      })
    })
  })

describeSSOValidationSchema('Okta', oktaValidationSchema, oktaValues, [
  'clientId',
  'organizationName',
])
describeSSOValidationSchema('Entra ID', entraIdValidationSchema, entraIdValues, [
  'clientId',
  'tenantId',
])
