import { ApolloError } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'

import { LagoApiError } from '~/generated/graphql'

export interface LagoGQLError extends GraphQLFormattedError {
  extensions: {
    code: LagoApiError
    details: Record<string, string[]>
  }
}

// --------------------- Graphql errors checker ---------------------
export const hasDefinedGQLError = (
  errorCode: keyof typeof LagoApiError,
  errorObject?: ApolloError | readonly GraphQLFormattedError[],
  key?: string,
) => {
  if (!errorObject) return false

  const errors = ((errorObject as ApolloError)?.graphQLErrors ||
    errorObject ||
    []) as LagoGQLError[]

  if (!errors?.length) return false

  const { code, details } = errors[0]?.extensions as LagoGQLError['extensions']

  if (!!details) {
    return key
      ? (details[key] || '').includes(LagoApiError[errorCode])
      : Object.values(details)
          .reduce((acc, fieldKey) => {
            return [...acc, ...fieldKey]
          }, [])
          .includes(LagoApiError[errorCode])
  }

  if (!!code) {
    return code === LagoApiError[errorCode]
  }
}
