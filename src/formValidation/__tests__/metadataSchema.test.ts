import {
  METADATA_KEY_MAX_LENGTH,
  METADATA_VALUE_MAX_LENGTH_DEFAULT,
  metadataSchema,
} from '~/formValidation/metadataSchema'

describe('metadataSchema', () => {
  describe('metadataSchema()', () => {
    describe('invalid', () => {
      it('has no key', () => {
        const values = [
          {
            value: 'value',
          },
        ]
        const schema = metadataSchema()
        const result = schema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has no value', () => {
        const values = [
          {
            key: 'key',
          },
        ]
        const schema = metadataSchema()
        const result = schema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has key too long with default setting', () => {
        const values = [
          {
            key: new Array(METADATA_KEY_MAX_LENGTH + 2).join('a'),
            value: 'value',
          },
        ]

        const schema = metadataSchema()
        const result = schema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has value too long with default size', () => {
        const values = [
          {
            key: 'key',
            value: new Array(METADATA_VALUE_MAX_LENGTH_DEFAULT + 2).join('a'),
          },
        ]

        const schema = metadataSchema()
        const result = schema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has value too long with custom size', () => {
        const values = [
          {
            key: 'key',
            value: new Array(4).join('a'),
          },
        ]

        const schema = metadataSchema({ valueMaxLength: 2 })
        const result = schema.isValidSync(values)

        expect(result).toBeFalsy()
      })
    })
    describe('valid', () => {
      it('has valid key and value', () => {
        const values = [
          {
            key: 'key',
            value: 'value',
          },
        ]
        const schema = metadataSchema()
        const result = schema.isValidSync(values)

        expect(result).toBeTruthy()
      })
      it('has key long enough with default setting', () => {
        const values = [
          {
            key: new Array(METADATA_KEY_MAX_LENGTH - 1).join('a'),
            value: 'value',
          },
        ]

        const schema = metadataSchema()
        const result = schema.isValidSync(values)

        expect(result).toBeTruthy()
      })
      it('has value long enough with default size', () => {
        const values = [
          {
            key: 'key',
            value: new Array(METADATA_VALUE_MAX_LENGTH_DEFAULT + 1).join('a'),
          },
        ]

        const schema = metadataSchema()
        const result = schema.isValidSync(values)

        expect(result).toBeTruthy()
      })
      it('has value long enough with custom size', () => {
        const values = [
          {
            key: 'key',
            value: new Array(3).join('a'),
          },
        ]

        const schema = metadataSchema({ valueMaxLength: 2 })
        const result = schema.isValidSync(values)

        expect(result).toBeTruthy()
      })
    })
  })
})
