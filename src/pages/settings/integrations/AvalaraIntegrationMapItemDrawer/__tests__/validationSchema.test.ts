import { avalaraMappingValidationSchema } from '../validationSchema'

const isValid = (values: unknown): boolean =>
  avalaraMappingValidationSchema.safeParse(values).success

describe('avalaraMappingValidationSchema', () => {
  describe('GIVEN a single billing entity', () => {
    it.each([
      ['both fields empty', { externalId: '', externalName: '' }, true],
      ['both fields filled', { externalId: 'id', externalName: 'name' }, true],
      ['only externalId filled', { externalId: 'id', externalName: '' }, false],
      ['only externalName filled', { externalId: '', externalName: 'name' }, false],
    ])('THEN should match the all-or-nothing rule with %s', (_, entry, expected) => {
      expect(isValid({ default: entry })).toBe(expected)
    })
  })

  describe('GIVEN several billing entities', () => {
    describe('WHEN one of them is partially filled', () => {
      it('THEN should be invalid', () => {
        expect(
          isValid({
            default: { externalId: 'id', externalName: 'name' },
            'be-1': { externalId: 'id', externalName: '' },
          }),
        ).toBe(false)
      })
    })
  })
})
