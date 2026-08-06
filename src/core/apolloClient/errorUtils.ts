import { ApolloError } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'

import { LagoApiError } from '~/generated/graphql'

export enum PspErrorCode {
  ThirdPartyError = 'third_party_error',
}

export interface LagoGQLError extends GraphQLFormattedError {
  extensions: {
    code: LagoApiError | PspErrorCode
    details: Record<string, string[]>
  }
}

export const extractThirdPartyErrorMessage = (
  errorObject?: ApolloError | readonly GraphQLFormattedError[],
): string | undefined => {
  if (!errorObject) return undefined

  const errors = ((errorObject as ApolloError)?.graphQLErrors ||
    errorObject ||
    []) as LagoGQLError[]

  if (!errors?.length) return undefined

  const { code, details } = errors[0]?.extensions as LagoGQLError['extensions']

  if (code !== PspErrorCode.ThirdPartyError || !details?.error) return undefined

  const errorDetail = details.error

  return Array.isArray(errorDetail) ? errorDetail[0] : errorDetail
}

const UNKNOWN_ERROR_IDENTIFIER = 'unknown'

// `extensions.code` is untyped by the GraphQL spec, so narrow it before using it
// as a Sentry tag or fingerprint component.
export const getGraphQLErrorCode = (extensions?: GraphQLFormattedError['extensions']): string =>
  typeof extensions?.code === 'string' ? extensions.code : UNKNOWN_ERROR_IDENTIFIER

// Sentry groups by the error message by default, so the generic HTTP messages the
// API returns ("Method Not Allowed", "Unprocessable Entity", ...) collapse unrelated
// failures into a single issue. Group per operation + error code instead.
export const buildGraphQLErrorFingerprint = (
  operationName: string | undefined,
  errorCode: string,
): Array<string> => ['graphql-error', operationName || UNKNOWN_ERROR_IDENTIFIER, errorCode]

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
