import { adminOrganizationCreateValidationSchema } from '../validationSchema'

const baseValues = {
  name: 'Acme Corp',
  ownerEmail: 'owner@example.com',
  timezone: undefined,
  premiumIntegrations: [],
  featureFlags: [],
}

const errorPaths = (values: unknown): string[] => {
  const result = adminOrganizationCreateValidationSchema.safeParse(values)

  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('adminOrganizationCreateValidationSchema', () => {
  it('accepts a valid organization', () => {
    expect(errorPaths(baseValues)).toEqual([])
  })

  it('requires a name', () => {
    expect(errorPaths({ ...baseValues, name: '' })).toContain('name')
    expect(errorPaths({ ...baseValues, name: '   ' })).toContain('name')
  })

  it('requires an owner email', () => {
    expect(errorPaths({ ...baseValues, ownerEmail: '' })).toContain('ownerEmail')
  })

  it('rejects a malformed owner email', () => {
    expect(errorPaths({ ...baseValues, ownerEmail: 'not-an-email' })).toContain('ownerEmail')
    expect(errorPaths({ ...baseValues, ownerEmail: 'owner@' })).toContain('ownerEmail')
  })

  it('accepts an optional timezone and selected options', () => {
    expect(
      errorPaths({
        ...baseValues,
        timezone: 'TZ_EUROPE_PARIS',
        premiumIntegrations: [{ value: 'salesforce' }],
        featureFlags: [{ value: 'some_flag' }],
      }),
    ).toEqual([])
  })
})
