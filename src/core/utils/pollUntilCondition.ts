type PollOptions = {
  maxAttempts: number
  pollInterval: number
}

type PollResult<T> = {
  data: T | null
  conditionMet: boolean
}

/**
 * Polls a function until a condition is met or max attempts is reached.
 * Waits for pollInterval before each poll attempt.
 *
 * @param fetchFn - Async function that fetches data
 * @param conditionFn - Function that checks if polling should stop (returns true to stop)
 * @param options - Polling options (maxAttempts, pollInterval)
 * @returns Object with final data and whether condition was met
 */
export async function pollUntilCondition<T>(
  fetchFn: () => Promise<T>,
  conditionFn: (data: T) => boolean,
  options: PollOptions,
): Promise<PollResult<T>> {
  const { maxAttempts, pollInterval } = options

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval))

    const data = await fetchFn()

    if (conditionFn(data)) {
      return { data, conditionMet: true }
    }
  }

  return { data: null, conditionMet: false }
}
