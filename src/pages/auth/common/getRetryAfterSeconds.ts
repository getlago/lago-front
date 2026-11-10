import { GraphQLFormattedError } from 'graphql'

export const getRetryAfterSeconds = (
  errors: readonly GraphQLFormattedError[] | undefined,
): number => {
  const details = errors?.[0]?.extensions?.details

  if (typeof details !== 'object' || details === null) return 0

  const retryAfterSeconds = 'retryAfterSeconds' in details ? details.retryAfterSeconds : undefined

  return typeof retryAfterSeconds === 'number' ? retryAfterSeconds : 0
}
