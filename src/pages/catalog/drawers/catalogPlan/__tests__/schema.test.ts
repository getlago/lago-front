import { CurrencyEnum } from '~/generated/graphql'

import { CATALOG_PLAN_FORM_DEFAULTS, VALUE_REQUIRED_KEY } from '../constants'
import { catalogPlanSchema } from '../schema'

const validValues = {
  ...CATALOG_PLAN_FORM_DEFAULTS,
  name: 'Premium',
  code: 'premium',
  currency: CurrencyEnum.Usd,
}

const messagesFor = (values: unknown): Record<string, string[]> => {
  const result = catalogPlanSchema.safeParse(values)

  if (result.success) return {}

  return result.error.issues.reduce<Record<string, string[]>>((acc, issue) => {
    const path = issue.path.join('.')

    return { ...acc, [path]: [...(acc[path] ?? []), issue.message] }
  }, {})
}

describe('catalogPlanSchema', () => {
  it('GIVEN name, code and currency THEN accepts the values', () => {
    expect(catalogPlanSchema.safeParse(validValues).success).toBe(true)
  })

  it('GIVEN an empty name THEN requires it', () => {
    expect(messagesFor({ ...validValues, name: '' }).name).toEqual([VALUE_REQUIRED_KEY])
  })

  it('GIVEN an empty code THEN requires it', () => {
    expect(messagesFor({ ...validValues, code: '' }).code).toEqual([VALUE_REQUIRED_KEY])
  })

  it('GIVEN no currency THEN requires it', () => {
    expect(messagesFor({ ...validValues, currency: undefined }).currency).toEqual([
      VALUE_REQUIRED_KEY,
    ])
  })

  it('GIVEN empty description and invoice display name THEN still accepts them', () => {
    expect(
      catalogPlanSchema.safeParse({ ...validValues, description: '', invoiceDisplayName: '' })
        .success,
    ).toBe(true)
  })
})
