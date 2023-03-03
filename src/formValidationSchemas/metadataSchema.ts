import { object, array, string } from 'yup'

const KEY_MAX_LENGTH = 20
const VALUE_MAX_LENGTH = 40

export enum MetadataErrorsEnum {
  uniqueness = 'uniqueness',
  maxLength = 'maxLength',
}

export const metadataSchema = () =>
  array().of(
    object().shape({
      key: string().test({
        test: function (value, { createError, path }) {
          if (!value) {
            return false
          }

          if (arguments[1].from[1]?.value?.metadata.length > 1) {
            const keysList = arguments[1].from[1]?.value?.metadata?.map(
              (m: { key: string }) => m.key
            )

            // Check key unicity
            if (keysList?.indexOf(value) !== keysList?.lastIndexOf(value)) {
              return createError({
                path,
                message: MetadataErrorsEnum.uniqueness,
              })
            }
          }

          if (value.length > KEY_MAX_LENGTH) {
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
          if (value.length > VALUE_MAX_LENGTH) {
            return createError({
              path,
              message: MetadataErrorsEnum.maxLength,
            })
          }

          return true
        },
      }),
    })
  )
