import { MetadataErrorsEnum } from '~/formValidation/metadataSchema'

import {
  CREDIT_NOTE_METADATA_KEY_MAX_LENGTH,
  CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH,
  MAX_CREDIT_NOTE_METADATA_COUNT,
  METADATA_EDIT_DEFAULT_VALUES,
  metadataEditValidationSchema,
} from '../validationSchema'

const parse = (metadata: Array<{ key: string; value: string }>) =>
  metadataEditValidationSchema.safeParse({ metadata })

const messagesFor = (
  metadata: Array<{ key: string; value: string }>,
  path: [number, 'key' | 'value'],
): string[] => {
  const result = parse(metadata)

  if (result.success) return []

  return result.error.issues
    .filter(
      (issue) =>
        issue.path[1] === path[0] && issue.path[2] === path[1] && issue.path[0] === 'metadata',
    )
    .map((issue) => issue.message)
}

describe('metadataEditDrawer validationSchema', () => {
  describe('GIVEN the limits the Formik/yup drawer enforced', () => {
    describe('WHEN reading the exported constants', () => {
      it.each([
        ['key max length', CREDIT_NOTE_METADATA_KEY_MAX_LENGTH, 40],
        ['value max length', CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH, 255],
        ['row cap', MAX_CREDIT_NOTE_METADATA_COUNT, 50],
      ])('THEN should keep the %s unchanged', (_, actual, expected) => {
        expect(actual).toBe(expected)
      })
    })

    describe('WHEN reading the default values', () => {
      it('THEN should start with no metadata row', () => {
        expect(METADATA_EDIT_DEFAULT_VALUES).toEqual({ metadata: [] })
      })
    })
  })

  describe('GIVEN valid metadata', () => {
    describe('WHEN parsing an empty list', () => {
      it('THEN should succeed', () => {
        expect(parse([]).success).toBe(true)
      })
    })

    describe('WHEN parsing distinct rows within the limits', () => {
      it('THEN should succeed', () => {
        expect(
          parse([
            { key: 'order_id', value: 'ORD-1' },
            { key: 'department', value: 'Sales' },
          ]).success,
        ).toBe(true)
      })
    })

    describe('WHEN a key and a value sit exactly on their limit', () => {
      it('THEN should succeed', () => {
        expect(
          parse([
            {
              key: 'a'.repeat(CREDIT_NOTE_METADATA_KEY_MAX_LENGTH),
              value: 'b'.repeat(CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH),
            },
          ]).success,
        ).toBe(true)
      })
    })
  })

  describe('GIVEN invalid metadata', () => {
    describe('WHEN a key is empty', () => {
      it('THEN should report the required error on that key', () => {
        expect(messagesFor([{ key: '', value: 'v' }], [0, 'key'])).toContain(
          MetadataErrorsEnum.required,
        )
      })
    })

    describe('WHEN a value is empty', () => {
      it('THEN should report the required error on that value', () => {
        expect(messagesFor([{ key: 'k', value: '' }], [0, 'value'])).toContain(
          MetadataErrorsEnum.required,
        )
      })
    })

    describe('WHEN a key is one character over the limit', () => {
      it('THEN should report the max length error on that key', () => {
        const metadata = [{ key: 'a'.repeat(CREDIT_NOTE_METADATA_KEY_MAX_LENGTH + 1), value: 'v' }]

        expect(messagesFor(metadata, [0, 'key'])).toContain(MetadataErrorsEnum.maxLength)
      })
    })

    describe('WHEN a value is one character over the limit', () => {
      it('THEN should report the max length error on that value', () => {
        const metadata = [
          { key: 'k', value: 'b'.repeat(CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH + 1) },
        ]

        expect(messagesFor(metadata, [0, 'value'])).toContain(MetadataErrorsEnum.maxLength)
      })
    })

    describe('WHEN two rows share the same key', () => {
      it.each([
        ['first', 0],
        ['second', 1],
      ])('THEN should report the uniqueness error on the %s row', (_, index) => {
        const metadata = [
          { key: 'duplicate', value: 'one' },
          { key: 'duplicate', value: 'two' },
        ]

        expect(messagesFor(metadata, [index as 0 | 1, 'key'])).toContain(
          MetadataErrorsEnum.uniqueness,
        )
      })
    })
  })
})
