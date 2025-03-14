import { array, object, string } from 'yup'

export const METADATA_VALUE_MAX_LENGTH_DEFAULT = 100
export const METADATA_KEY_MAX_LENGTH = 20

export enum MetadataErrorsEnum {
  uniqueness = 'uniqueness',
  maxLength = 'maxLength',
}

export const metadataSchema = ({
  valueMaxLength = METADATA_VALUE_MAX_LENGTH_DEFAULT,
  metadataKey = 'metadata',
} = {}) =>
  array().of(
    object().shape({
      key: string().test({
        test: function (value, { createError, path, from }) {
          if (!value) {
            return false
          }

          if (from?.[1]?.value?.[metadataKey]?.length > 1) {
            const keysList = from?.[1]?.value?.[metadataKey]?.map((m: { key: string }) => m.key)

            // Check key unicity
            if (keysList?.indexOf(value) !== keysList?.lastIndexOf(value)) {
              return createError({
                path,
                message: MetadataErrorsEnum.uniqueness,
              })
            }
          }

          if (value.length > METADATA_KEY_MAX_LENGTH) {
            return createError({
              path,
              message: MetadataErrorsEnum.maxLength,
            })
          }

          return true
        },
      }),
      value: string().test({
        test: (value, { createError, path }) => {
          if (!value) return false
          if (value.length > valueMaxLength) {
            return createError({
              path,
              message: MetadataErrorsEnum.maxLength,
            })
          }

          return true
        },
      }),
    }),
  )
