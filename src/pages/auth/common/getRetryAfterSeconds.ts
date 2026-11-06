import { GraphQLFormattedError } from 'graphql'

export const getRetryAfterSeconds = (
  errors: readonly GraphQLFormattedError[] | undefined,
): number => {
  const details = errors?.[0]?.extensions?.details

  if (typeof details !== 'object' || details === null) return 0

  const retryAfterSeconds = Object.entries(details).find(
    ([key]) => key === 'retryAfterSeconds',
  )?.[1]

  return typeof retryAfterSeconds === 'number' ? retryAfterSeconds : 0
}
