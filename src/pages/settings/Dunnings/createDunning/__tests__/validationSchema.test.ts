import { CurrencyEnum } from '~/generated/graphql'

import { dunningCampaignFormSchema, DunningCampaignFormValues } from '../validationSchema'

const validValues: DunningCampaignFormValues = {
  name: 'Overdue reminder',
  code: 'overdue_reminder',
  description: '',
  thresholds: [{ currency: CurrencyEnum.Usd, amountCents: '100' }],
  daysBetweenAttempts: '2',
  maxAttempts: '3',
  bccEmails: '',
  appliedToOrganization: false,
}

const invalidPaths = (values: DunningCampaignFormValues): string[] => {
  const result = dunningCampaignFormSchema.safeParse(values)

  if (result.success) return []

  return [...new Set(result.error.issues.map((issue) => issue.path.join('.')))].sort()
}

describe('dunningCampaignFormSchema', () => {
  describe('GIVEN a fully filled campaign', () => {
    describe('WHEN parsing it', () => {
      it('THEN should report no error', () => {
        expect(invalidPaths(validValues)).toEqual([])
      })
    })
  })

  describe('GIVEN a required field left empty', () => {
    describe('WHEN parsing the form', () => {
      it.each([
        ['name', { name: '' }],
        ['code', { code: '' }],
        ['daysBetweenAttempts', { daysBetweenAttempts: '' }],
        ['maxAttempts', { maxAttempts: '' }],
      ])('THEN should report %s as invalid', (path, override) => {
        expect(invalidPaths({ ...validValues, ...override })).toEqual([path])
      })

      it('THEN should accept an empty description', () => {
        expect(invalidPaths({ ...validValues, description: '' })).toEqual([])
      })
    })
  })

  describe('GIVEN an attempts field below one', () => {
    describe('WHEN parsing the form', () => {
      it.each([
        ['daysBetweenAttempts', { daysBetweenAttempts: '0' }],
        ['maxAttempts', { maxAttempts: '0' }],
      ])('THEN should report %s as invalid', (path, override) => {
        expect(invalidPaths({ ...validValues, ...override })).toEqual([path])
      })

      it.each([
        ['daysBetweenAttempts', { daysBetweenAttempts: '1' }],
        ['maxAttempts', { maxAttempts: '1' }],
      ])('THEN should accept exactly one for %s', (_path, override) => {
        expect(invalidPaths({ ...validValues, ...override })).toEqual([])
      })
    })
  })

  describe('GIVEN a threshold', () => {
    describe('WHEN the currency is missing', () => {
      it('THEN should report the currency as invalid', () => {
        expect(
          invalidPaths({
            ...validValues,
            thresholds: [{ currency: undefined, amountCents: '100' }],
          }),
        ).toEqual(['thresholds.0.currency'])
      })
    })

    describe('WHEN the amount is empty', () => {
      it('THEN should report the amount as invalid', () => {
        expect(
          invalidPaths({
            ...validValues,
            thresholds: [{ currency: CurrencyEnum.Usd, amountCents: '' }],
          }),
        ).toEqual(['thresholds.0.amountCents'])
      })

      it('THEN should accept a zero amount', () => {
        expect(
          invalidPaths({
            ...validValues,
            thresholds: [{ currency: CurrencyEnum.Usd, amountCents: '0' }],
          }),
        ).toEqual([])
      })
    })

    describe('WHEN the list is empty', () => {
      it('THEN should report the list as invalid', () => {
        expect(invalidPaths({ ...validValues, thresholds: [] })).toEqual(['thresholds'])
      })
    })

    describe('WHEN two rows share the same currency', () => {
      it('THEN should report the duplicate row currency as invalid', () => {
        expect(
          invalidPaths({
            ...validValues,
            thresholds: [
              { currency: CurrencyEnum.Usd, amountCents: '100' },
              { currency: CurrencyEnum.Usd, amountCents: '200' },
            ],
          }),
        ).toEqual(['thresholds.1.currency'])
      })
    })

    describe('WHEN two rows use distinct currencies', () => {
      it('THEN should report no error', () => {
        expect(
          invalidPaths({
            ...validValues,
            thresholds: [
              { currency: CurrencyEnum.Usd, amountCents: '100' },
              { currency: CurrencyEnum.Eur, amountCents: '200' },
            ],
          }),
        ).toEqual([])
      })
    })
  })

  describe('GIVEN a BCC email list', () => {
    describe('WHEN every address is valid', () => {
      it.each([
        ['a single address', 'a@b.com'],
        ['several addresses', 'a@b.com,c@d.com'],
        ['addresses padded with spaces', ' a@b.com , c@d.com '],
        // Blank segments are dropped before saving, so a half-typed list must not block submit
        ['a trailing comma', 'a@b.com,'],
        ['an empty list', ''],
      ])('THEN should accept %s', (_label, bccEmails) => {
        expect(invalidPaths({ ...validValues, bccEmails })).toEqual([])
      })
    })

    describe('WHEN one address is malformed', () => {
      it.each([
        ['the only address', 'nope'],
        ['the last of several', 'a@b.com,nope'],
      ])('THEN should report the field as invalid when %s is malformed', (_label, bccEmails) => {
        expect(invalidPaths({ ...validValues, bccEmails })).toEqual(['bccEmails'])
      })
    })
  })
})
