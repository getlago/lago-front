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

/**
 * Whether a GraphQL error was declared silent by the operation's context:
 * either its top-level code is listed in `silentErrorCodes`, or one of its
 * detail codes is listed in `silentErrorDetails`. Silent errors are the ones
 * the caller handles itself, so the global error link neither toasts nor
 * reports them to Sentry. Detail-level silencing exists for errors sharing a
 * generic top-level code (a handled validation rule is `unprocessable_entity`
 * like any other 422, only its details tell it apart).
 */
export const isSilencedGQLError = ({
  extensions,
  silentErrorCodes,
  silentErrorDetails,
}: {
  extensions?: GraphQLFormattedError['extensions']
  silentErrorCodes: unknown[]
  silentErrorDetails: unknown[]
}): boolean => {
  if (silentErrorCodes.includes(extensions?.code)) return true

  if (!silentErrorDetails.length) return false

  const details = (extensions?.details || {}) as LagoGQLError['extensions']['details']
  const detailCodes = Object.values(details).flat()

  return silentErrorDetails.some((code) => detailCodes.includes(code as string))
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
